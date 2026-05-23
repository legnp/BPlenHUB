# Mapa de Hardening & Segurança Soberana 🛡️⚖️

Com base na arquitetura atual do BPlen HUB, identifiquei oportunidades para elevar a segurança de "Eficiente" para "Inviolável". Abaixo, as medidas recomendadas para prevenir roubo de dados, ataques de força bruta e personificação de usuários.

## 🛡️ Camada 1: Integridade do Ambiente (Firebase App Check)
**Risco**: Um hacker pode copiar sua `apiKey` e usar um script externo para tentar baixar dados do Firestore, ignorando o seu site.
- **Medida**: Implementar o **Firebase App Check**.
- **Como funciona**: Ele gera um "token de atestação" que prova que a requisição está vindo REALMENTE do seu site oficial. Scripts externos ou apps clonados são bloqueados automaticamente.

## 🔑 Camada 2: Proteção de Identidade (MFA & MFA Personalizado)
**Risco**: "Clonagem" de conta ou roubo de senha do usuário.
- **Medida**: 
    1. **MFA (Autenticação de Dois Fatores)**: Exigir código via SMS ou E-mail para logins administrativos.
    2. **Validação de Matrícula**: Já usamos a matrícula, mas podemos adicionar um "PIN de Segurança" para ações críticas (como deletar um produto ou ver dados DISC de terceiros).

## 🗄️ Camada 3: Soberania de Arquivos (Storage Hardening)
**Risco**: Alguém descobrir a URL direta de um documento PDF ou imagem privada.
- **Medida**: Uso de **Signed URLs** (URLs com tempo de expiração).
- **Como funciona**: O arquivo fica 100% privado no Google Cloud Storage. Quando o usuário clica para ver, o servidor gera um link que dura apenas 5 minutos e só funciona para aquele usuário.

## 📝 Camada 4: Auditoria e Rastreabilidade (Security Logs)
**Risco**: Um administrador "mal intencionado" ou conta hackeada faz alterações sem rastro.
- **Medida**: Implementar um **Log de Auditoria Soberano**.
- **Como funciona**: Toda ação no Admin (criar cupom, alterar usuário) dispara uma Cloud Function que grava em uma coleção protegida `/SecurityLogs`: *Quem fez, O que fez, Quando fez e IP de origem*.

## 🚦 Camada 5: Prevenção de Força Bruta (Rate Limiting)
**Risco**: Scripts tentando "adivinhar" matrículas ou cupons de desconto por milhares de tentativas.
- **Medida**: Implementar **Throttling** via Server Actions.
- **Como funciona**: Se o sistema detectar mais de 5 tentativas de acesso inválidas em 1 minuto do mesmo IP, esse IP é bloqueado temporariamente (Ban 30s).

---

## Próximos Passos Sugeridos

> [!IMPORTANT]
> Recomendo iniciarmos pela **Camada 1 (App Check)** e pela **Camada 4 (Logs de Auditoria)**. O App Check protege contra ataques técnicos e os Logs nos dão visibilidade sobre o que está acontecendo dentro do sistema.

**Qual destas camadas você considera mais prioritária para implementarmos primeiro?**
