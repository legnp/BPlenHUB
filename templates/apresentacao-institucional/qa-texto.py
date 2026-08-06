# -*- coding: utf-8 -*-
"""
QA de encaixe de texto usando as fontes Arial reais do Windows (PIL), ja
que nao ha LibreOffice/PowerPoint nesta maquina para renderizar de verdade.
Simula quebra de linha por largura e compara a altura resultante com a
altura da caixa declarada no pptxgenjs (lida do build.js).
"""
import re, sys
from PIL import ImageFont

FONT_REGULAR = "/c/Windows/Fonts/arial.ttf"
FONT_BOLD = "/c/Windows/Fonts/arialbd.ttf"
FONT_ITALIC = "/c/Windows/Fonts/ariali.ttf"
EMU_POR_POL = 914400
PT_POR_POL = 72
LINESPACING_PADRAO = 1.28  # o mesmo multiplicador usado em corpo() no build.js

def carregar_fonte(bold, italic, size_pt):
    path = FONT_BOLD if bold else (FONT_ITALIC if italic else FONT_REGULAR)
    # PIL usa tamanho em "pixels" a 72dpi ~ equivalente a pt
    return ImageFont.truetype(path, size=int(size_pt * 4))  # 4x para precisao subpixel, escala depois

def largura_texto(fonte, texto):
    bbox = fonte.getbbox(texto)
    return (bbox[2] - bbox[0]) / 4.0  # desfaz o fator 4x, retorna em "pt"

def quebrar_linhas(texto, fonte, largura_max_pt):
    linhas = []
    for paragrafo in texto.split("\n"):
        palavras = paragrafo.split(" ")
        atual = ""
        for palavra in palavras:
            teste = (atual + " " + palavra).strip()
            if largura_texto(fonte, teste) <= largura_max_pt or not atual:
                atual = teste
            else:
                linhas.append(atual)
                atual = palavra
        linhas.append(atual)
    return linhas

def checar(texto, w_pol, h_pol, size_pt, bold=False, italic=False, label="", linespacing=LINESPACING_PADRAO):
    fonte = carregar_fonte(bold, italic, size_pt)
    largura_max_pt = w_pol * PT_POR_POL
    linhas = quebrar_linhas(texto, fonte, largura_max_pt)
    altura_linha_pt = size_pt * linespacing
    altura_total_pt = len(linhas) * altura_linha_pt
    altura_disponivel_pt = h_pol * PT_POR_POL
    status = "OK" if altura_total_pt <= altura_disponivel_pt else "ESTOURA"
    margem_pt = altura_disponivel_pt - altura_total_pt
    print(f"[{status}] {label}: {len(linhas)} linha(s), precisa {altura_total_pt:.0f}pt, tem {altura_disponivel_pt:.0f}pt (folga {margem_pt:.0f}pt)")
    if status == "ESTOURA":
        for l in linhas:
            print("      >", l)
    return status == "OK"

# ============================================================
# Casos extraidos do build.js — os blocos de texto mais arriscados
# (paragrafos longos em caixas estreitas/baixas)
# ============================================================
casos = [
    # slide 2 — quem somos
    dict(texto="Somos uma consultoria de negócios com foco em Desenvolvimento Humano, nascida da experiência holística de sua fundadora em grandes multinacionais e no empreendedorismo.",
         w_pol=6.7, h_pol=2.6, size_pt=17, label="s02 card esquerdo"),
    dict(texto="Não fazemos consultoria genérica. Atuamos onde o técnico encontra o humano — com método, dados e proximidade real.",
         w_pol=3.8, h_pol=2.6, size_pt=13.5, label="s02 card direito"),
    # slide 3 — missao / o que nos move
    dict(texto="Ajudar pessoas e negócios a alinhar objetivos através do desenvolvimento humano prático, aplicado à realidade com clareza, método e execução, para gerar resultados sustentáveis.",
         w_pol=4.95, h_pol=2.4, size_pt=14.5, label="s03 missao"),
    dict(texto="Integramos dados, métodos e desenvolvimento humano para transformar contextos em oportunidades e potencializar a performance sustentável.",
         w_pol=4.95, h_pol=2.4, size_pt=14.5, label="s03 o-que-nos-move"),
    # slide 4 — para quem (3 colunas)
    dict(texto="Gestão de Carreira Completa", w_pol=3.15, h_pol=1.9, size_pt=14, label="s04 pessoas"),
    dict(texto="HRBP como um serviço", w_pol=3.15, h_pol=1.9, size_pt=14, label="s04 empresas"),
    dict(texto="Projetos e ativações de negócio em conjunto", w_pol=3.15, h_pol=1.9, size_pt=14, label="s04 parceiros"),
    # slides de transicao (05, 07, 11) — titulo usa lineSpacingMultiple:1.04 no build.js
    dict(texto="O futuro do trabalho é complexo porque a maioria das dores não é técnica — é humana.",
         w_pol=10.8, h_pol=2.1, size_pt=40, bold=True, linespacing=1.04, label="s05 titulo transicao"),
    dict(texto="O desafio é cuidar do invisível: expectativas, confiança e coerência.",
         w_pol=8.2, h_pol=1.3, size_pt=15, label="s05 corpo transicao"),
    dict(texto="Atuamos em três frentes que vão do técnico ao humano, dos dados às pessoas.",
         w_pol=10.8, h_pol=2.1, size_pt=40, bold=True, linespacing=1.04, label="s07 titulo transicao"),
    dict(texto="Com foco no desenvolvimento real — não em fórmulas prontas.",
         w_pol=8.2, h_pol=1.3, size_pt=15, label="s07 corpo transicao"),
    dict(texto="Quatro pilares que transformam a consultoria tradicional em parceria estratégica.",
         w_pol=10.8, h_pol=2.1, size_pt=40, bold=True, linespacing=1.04, label="s11 titulo transicao (sem corpo)"),
    # slide 6 — estatisticas (4 cards, texto ao lado do numero grande)
    dict(texto="Falta de mão de obra qualificada compromete o crescimento", w_pol=2.85, h_pol=1.15, size_pt=12.5, label="s06 stat 62%"),
    dict(texto="Aumento de licenças no INSS por saúde mental em 10 anos", w_pol=2.85, h_pol=1.15, size_pt=12.5, label="s06 stat 68%"),
    dict(texto="Acreditam no autodesenvolvimento — menos de 1% conta com o RH", w_pol=2.85, h_pol=1.15, size_pt=12.5, label="s06 stat 50%"),
    dict(texto="Dos negócios reconhecem: as barreiras são pessoas e comunicação", w_pol=2.85, h_pol=1.15, size_pt=12.5, label="s06 stat 30%"),
    # slides 8-10 — pilares (nome grande + paragrafo)
    dict(texto="Desenvolvimento de Carreira", w_pol=8, h_pol=1.1, size_pt=32, bold=True, label="s08 nome pilar 1"),
    dict(texto="Consultoria e gestão de carreira com métodos práticos, através de trilhas de desenvolvimento e posicionamento para profissionais que querem elevar sua performance e relevância.",
         w_pol=7.6, h_pol=1.7, size_pt=15.5, label="s08 corpo pilar 1"),
    dict(texto="Estratégia, Analytics e Cultura", w_pol=8, h_pol=1.1, size_pt=32, bold=True, label="s09 nome pilar 2"),
    dict(texto="Consultoria e serviços de HRBP nos pilares de Employee Experience, People Analytics e Clima e Cultura para impulsionar a performance organizacional.",
         w_pol=7.6, h_pol=1.7, size_pt=15.5, label="s09 corpo pilar 2"),
    # slides 12-13 — 4 forcas (cards com nome + tagline + corpo)
    dict(texto="Do técnico ao humano", w_pol=5.1, h_pol=0.7, size_pt=19, bold=True, label="s12 nome forca 1"),
    dict(texto="Cruzamento inteligente de dados robustos com sensibilidade humana para decisões que fazem sentido para o negócio e para a vida.",
         w_pol=5.1, h_pol=1.9, size_pt=12.5, label="s12 corpo forca 1"),
    dict(texto="Não acreditamos em treinamentos isolados. O desenvolvimento acontece no dia a dia, em cada reunião, feedback e decisão estratégica.",
         w_pol=5.1, h_pol=1.9, size_pt=12.5, label="s12 corpo forca 2"),
    # slide 14 — valores (5 colunas estreitas — o mais arriscado)
    dict(texto="Evidência como base", w_pol=2.34, h_pol=0.65, size_pt=13.5, bold=True, label="s14 nome valor 2 (mais longo)"),
    dict(texto="Cada objetivo precisa fazer sentido para todos. Combinar antes, ajustar depois.",
         w_pol=2.34, h_pol=2.3, size_pt=10.5, label="s14 corpo acordos"),
    dict(texto="Desenvolvimento contínuo para autonomia e inovação. Aprender sempre, transmitir aprendizado.",
         w_pol=2.34, h_pol=2.3, size_pt=10.5, label="s14 corpo educacao (mais longo)"),
    # slide 15 — fundadora
    dict(texto="Vive o empreendedorismo desde a juventude e há 10 anos ajuda pessoas e negócios a alinharem seus interesses e resultados.",
         w_pol=7.4, h_pol=1.1, size_pt=15, label="s15 intro fundadora"),
    dict(texto="Contribuição para o selo GPTW com eNPS acima de 80% · estruturação de frentes estratégicas de RH · +50% de ganho em agilidade de processos · NPS acima de 4.8",
         w_pol=6.7, h_pol=1.05, size_pt=12.5, label="s15 resultados (denso)"),
    dict(texto="Passagem por multinacionais e grandes marcas, em projetos educacionais, inteligência de mercado e Desenvolvimento Humano Organizacional (DHO), antes de fundar a BPlen.",
         w_pol=3.75, h_pol=3.1, size_pt=12.5, label="s15 coluna lateral"),
    # slide 18 — trajetoria (5 colunas estreitas)
    dict(texto="Projetos educacionais\n(Gov-SP, Hertft, Itaú)", w_pol=2.25, h_pol=1.3, size_pt=11.5, label="s18 marco 2013"),
    dict(texto="RH e DHO\n(Acer, Samsung, Smart Beauty)", w_pol=2.25, h_pol=1.3, size_pt=11.5, label="s18 marco 2019 (mais longo)"),
    # slide 19 — resultados (4 cards estreitos)
    dict(texto="de experiência ajudando pessoas e negócios a alinhar interesses e resultados",
         w_pol=2.35, h_pol=1.9, size_pt=12, label="s19 stat 10 anos"),
    dict(texto="de eNPS em contribuição para o selo GPTW em projetos conduzidos",
         w_pol=2.35, h_pol=1.9, size_pt=12, label="s19 stat 80%"),
    # slide 20 — cta
    dict(texto="Uma conversa inicial, sem custo, para entender seu cenário e avaliar como o desenvolvimento humano pode se aplicar a ele.",
         w_pol=8.5, h_pol=0.8, size_pt=15, label="s20 corpo cta"),

    # capa — headline (linha ja quebrada manualmente com \n no build.js)
    dict(texto="Descomplicando o desenvolvimento\nhumano no trabalho",
         w_pol=11, h_pol=2.1, size_pt=42, bold=True, linespacing=1.05, label="s01 capa headline"),

    # todas as chamadas do helper titulo() — box fixa h=1.1, lineSpacingMultiple=1.02
    dict(texto="Somos o seu HRBP que ajuda a descomplicar o desenvolvimento humano no trabalho.",
         w_pol=11.6, h_pol=1.1, size_pt=30, bold=True, linespacing=1.02, label="s02 titulo() (mais longo)"),
    dict(texto="O que nos guia", w_pol=11.5, h_pol=1.1, size_pt=32, bold=True, linespacing=1.02, label="s03 titulo()"),
    dict(texto="Três frentes, um mesmo método", w_pol=11.5, h_pol=1.1, size_pt=32, bold=True, linespacing=1.02, label="s04 titulo()"),
    dict(texto="Quatro sintomas de um mesmo problema", w_pol=11.6, h_pol=1.1, size_pt=28, bold=True, linespacing=1.02, label="s06 titulo()"),
    dict(texto="Forças 1 e 2", w_pol=11.5, h_pol=1.1, size_pt=26, bold=True, linespacing=1.02, label="s12 titulo()"),
    dict(texto="Desenvolvimento através de atitudes coerentes", w_pol=11.8, h_pol=1.1, size_pt=27, bold=True, linespacing=1.02, label="s14 titulo()"),
    dict(texto="Lisandra Lencina", w_pol=11.5, h_pol=1.1, size_pt=34, bold=True, linespacing=1.02, label="s15 titulo()"),
    dict(texto="De onde viemos até aqui", w_pol=11.5, h_pol=1.1, size_pt=30, bold=True, linespacing=1.02, label="s18 titulo()"),
    dict(texto="O que essa trajetória já entregou", w_pol=11.6, h_pol=1.1, size_pt=28, bold=True, linespacing=1.02, label="s19 titulo()"),

    # fundadora — lista de empresas na coluna lateral
    dict(texto="Acer · Samsung · Smart Beauty · Governo-SP · Itaú",
         w_pol=3.75, h_pol=1.0, size_pt=13, bold=True, italic=True, linespacing=1.3, label="s15 lista empresas"),
]

todos_ok = True
for c in casos:
    ok = checar(**c)
    todos_ok = todos_ok and ok

print("\n" + ("TUDO OK" if todos_ok else "HA ESTOUROS — revisar acima"))
sys.exit(0 if todos_ok else 1)
