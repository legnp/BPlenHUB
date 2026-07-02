# BPlen HUB — Plano Mestre de Homologação e Refinamento Fullstack

Este é o checklist mestre do processo de validação amplo do sistema (infra, banco,
design, arquitetura, lógicas de fluxo, regras de negócio, textos/tons). Ele é
**a fonte de verdade compartilhada entre chats** — todo chat de execução lê este
arquivo (e o `LOG.md`) antes de agir, e atualiza o status aqui ao final.

Este arquivo é preenchido/estruturado pelo chat de planejamento a partir dos 5
mapas (`01` a `05`). Ainda não populado.

---

## Protocolo entre chats

1. Todo chat de execução deve ler este arquivo + as últimas entradas do `LOG.md`
   antes de agir, e deve terminar registrando uma entrada no `LOG.md` (data,
   escopo trabalhado, achados, decisões, mudanças de status neste plano).
2. Ao tentar um item do checklist, o chat de execução decide o **Modo de
   validação** na hora, não antes:
   - Se conseguir validar sozinho (código + preview) → marca `Automatizado`,
     executa, registra `Resultado`/`Status`, e abre bug em `BUGS.md` se achar algo.
   - Se não conseguir (bloqueado por login, exige dispositivo real, exige
     julgamento humano, exige carga real, etc.) → marca `Requer execução humana`
     e escreve ali mesmo um protocolo guiado passo a passo para a Gestora
     (Victor) executar e reportar o resultado, que então é registrado de volta
     no item.
3. Bugs encontrados durante qualquer fase são registrados em `BUGS.md` antes de
   decidir corrigir inline ou adiar (ver regras de área sensível no `CLAUDE.md`
   da raiz do projeto).

---

## Template de item de checklist

```
### [ID] Nome do item
- Categoria(s) de qualidade: [ex: Usabilidade / Segurança / Performance]
- Critério de aceite: [o que define "passou" de forma objetiva e verificável]
- Modo de validação: PENDENTE
- Status: Não iniciado
- Resultado: —
- Bug(s) vinculado(s): —
- Log: —
```

---

## Checagem cruzada — ISO/IEC 25010

*A ser preenchida pelo chat de planejamento: confirmar que o escopo das fases
abaixo cobre as 8 características de qualidade (adequação funcional, usabilidade,
performance, confiabilidade, segurança, compatibilidade, manutenibilidade,
portabilidade), documentando explicitamente onde cada uma é endereçada.*

---

## Fases

*A ser detalhado pelo chat de planejamento com base nos 5 mapas. Esqueleto de
partida: Fase 0 (Fundamentos: design canônico via Mapa 5, schema/API/segurança
canônicos via Mapa 4) → Fase 1 (validação por página, Mapa 2) → Fase 2 (features
transversais, Mapa 1) → Fase 3 (auditoria de regras de negócio, Mapa 3) → Fase 4
(regressão end-to-end de jornadas completas) → tracks adicionais (não-funcional,
segurança sistemática, integridade de dados, observabilidade, integrações
externas, compliance/LGPD — com profundidade diferenciada por track, ver riscos
aceitos abaixo).*

---

## Riscos Aceitos / Fora de Escopo

Pontos que este processo **não cobre por limite estrutural**, não por omissão:

1. **Auditoria de segurança independente** (pentest formal por terceiro) — o
   processo encontra e corrige o que análise de código e teste revelam, não
   simula um atacante real com ferramentas dedicadas.
2. **Teste de carga real** — exigiria infraestrutura de load-test dedicada, fora
   do alcance de análise de código + preview.
3. **Certificação jurídica formal de LGPD** — o processo documenta boas práticas
   técnicas já aplicadas, mas conformidade legal com força jurídica exige
   avaliação de advogado especializado.
4. **Sign-off multi-stakeholder** — aqui a aprovação é feita pela Gestora única
   (Victor), o que é adequado ao porte do projeto, mas não equivale a um
   processo corporativo com múltiplos aprovadores formais de diferentes áreas.

Esses pontos ficam registrados como risco aceito e conhecido, não como pendência
esquecida.
