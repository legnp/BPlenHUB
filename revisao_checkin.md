# 📋 Revisão: Survey de Check-in (V1.0)

Esta é a estrutura técnica atual da survey de Check-in. Sinta-se à vontade para sugerir alterações nos textos, opções ou lógica de navegação.

---

### Passo 1: Introdução
- **ID**: `q1_intro`
- **Pergunta**: "Olá {User_Nickname}! Agora que já se familiarizou com a plataforma, você nos permite conhecer um pouco mais sobre você?"
- **Opções**: 
  - "Com certeza" (Vai para: `q2_com_certeza`)
  - "Sim, mas não muito" (Vai para: `q2_mas_nao_muito`)

### Passo 2A: Preocupação (Fluxo Negativo)
- **ID**: `q2_mas_nao_muito`
- **Pergunta**: "{User_Nickname}, entendido. Hoje qual é a sua maior preocupação em contar sobre você?"
- **Tipo**: Campo de texto aberto.

### Passo 2B: Ponto Positivo (Fluxo Positivo)
- **ID**: `q2_com_certeza`
- **Pergunta**: "Legal!!! Vamos nessa! Qual é a melhor coisa sobre você, que deveríamos saber para te apoiar na sua jornada?"
- **Tipo**: Campo de texto aberto.

### Passo 3: Objetivos
- **ID**: `q3_objetivos`
- **Pergunta**: "{User_Nickname}, qual é o seu principal objetivo pelos próximos 90 dias, 6 meses e 5 anos?"
- **Tipo**: Campo de texto aberto.

### Passo 4: Barreiras
- **ID**: `q4_barreiras`
- **Pergunta**: "Quais são as maiores barreiras que você enfrenta hoje para alcançar esses objetivos?"
- **Tipo**: Campo de texto aberto.

### Passo 5: Desafios (Seleção Múltipla)
- **ID**: `q5_desafios`
- **Pergunta**: "Certo! E dentro desse contexto, quais são os SEUS 3 a 5 maiores desafios?"
- **Opções**: (Lista de 15 desafios técnicos e emocionais)
- **Regra**: Mínimo 3, Máximo 5.

### Passo 6: Nicho e Área
- **ID**: `q6_nicho`
- **Pergunta**: "{User_Nickname}, qual o seu principal nicho e área de atuação hoje?"
- **Tipo**: Seleção em cascata (Nicho -> Departamento).

### Passo 7: Rotina e Cargo
- **ID**: `q7_rotina`
- **Pergunta**: "Nos conte um pouco mais sobre o que você faz. Qual é o seu cargo atual? Quais são suas atividades? Como é a sua rotina?"
- **Tipo**: Campo de texto aberto.

### Passo 8: Maturidade
- **ID**: `q8a_maturidade`
- **Pergunta**: "Qual é o estágio da maturidade da sua carreira profissional?"
- **Tipo**: Seleção em cascata (Estágio -> Tempo de Experiência).

### Passo 9: Regime de Trabalho
- **ID**: `q8b_regime`
- **Pergunta**: "{User_Nickname}, hoje você está empregado em regime CLT ou PJ?"
- **Opções**: CLT, PJ, Informal, Desempregado (Vai para pacote anterior).

### Passo 10: Benefícios e Remuneração
- **ID**: `q8c_pacote`
- **Pergunta**: "Como está o seu pacote de remuneração e benefícios atual?"
- **Tipo**: Grid de benefícios (Checklist).

### Passo 11: Expectativa
- **ID**: `q9_como_podemos_ajudar`
- **Pergunta**: "{User_Nickname}, o que você espera encontrar por aqui? Como podemos te ajudar?"
- **Tipo**: Campo de texto aberto.

### Passo 12: NPS / Experiência
- **ID**: `q10_likert`
- **Pergunta**: "Até aqui, como você avalia a sua experiência? E como gostaria que continuássemos te conduzindo?"
- **Tipo**: Escala de Estrelas (1-5).
