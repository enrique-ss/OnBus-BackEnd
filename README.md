# OnBus - Backend

API REST em Node.js + TypeScript para sistema de bilhetagem eletrônica de transporte coletivo.

## Pré-requisitos

- Node.js 18+
- npm

## Instalação

```bash
npm install
cp .env.example .env
```

## Configuração

Variáveis de ambiente (`.env`):

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=sua_chave_jwt
WEBHOOK_SECRET=sua_chave_webhook
VALIDADOR_ID=1203
RESEND_API_KEY=re_...
EMAIL_FROM=OnBus <no-reply@seudominio.com>
APP_URL=https://api.seudominio.com
PAYMENT_API_URL=https://seu-gateway.example/v1/payments
PAYMENT_API_KEY=...
PAYMENT_TOKEN_ENCRYPTION_KEY=uma-chave-aleatoria-com-pelo-menos-32-caracteres
```

O servidor executa as migrations pendentes antes de abrir a API. Configure `RESEND_API_KEY` e `EMAIL_FROM` para recuperação de senha e autenticação em dois fatores (Resend). A recuperação envia um link para a tela hospedada pelo backend. A API recusa recargas Pix e recargas programadas enquanto o gateway não estiver configurado. O gateway configurado deve aceitar `POST` autenticado com `amount`, `currency`, `reference` e `payment_method` (Pix), retornando `paymentId` e `pixCopiaCola`; para cobrança programada, aceita `payment_method_id` e retorna `status: "approved"` quando cobrado. O token de pagamento salvo fica cifrado com `PAYMENT_TOKEN_ENCRYPTION_KEY`. O webhook de confirmação continua exigindo `X-Webhook-Signature`.

### Recuperação, segundo fator e recarga automática

- `POST /api/auth/forgot-password` com `{ "email": "..." }` solicita link de uso único (30 min).
- `POST /api/auth/reset-password` com `{ "token": "...", "senha": "mínimo 8 caracteres" }` redefine a senha. O link enviado abre uma tela que chama essa rota.
- `PUT /api/auth/two-factor` (JWT) com `{ "ativo": true }` ativa o código por email no login. O login retorna HTTP 202 e `requiresTwoFactor`; confirme em `POST /api/auth/verify-email-code` com `{ "email": "...", "codigo": "123456" }`.
- `POST /api/recargas-programadas` (JWT) recebe `{ "cartaoId": "...", "valor": 50, "saldoMinimo": 10, "paymentMethodId": "token-salvo-no-gateway" }`. `GET` lista e `DELETE /api/recargas-programadas/:id` cancela. A rotina verifica o saldo a cada minuto e só credita após aprovação do gateway.

Tokens de recuperação e códigos de login são armazenados como hashes e expiram. Códigos de login duram 10 minutos. A rota antiga `POST /api/transacoes/:id/pagar` foi desativada; uma chamada do cliente não comprova pagamento.

### Cashback, avaliações, suporte, termos e viagens

- Cashback: cada recarga confirmada credita **1 ponto por real inteiro**; veja saldo e extrato em `GET /api/profile/cashback`. Os pontos ainda não são resgatáveis.
- Avaliações: `POST /api/avaliacoes/ultimo-embarque` aceita `{ "notaOnibus": 1, "notaMotorista": 1, "comentario": "..." }`. Só permite uma avaliação do último embarque autorizado. O administrador associa ônibus e motorista à catraca em `PUT /api/admin/catracas/:id/associacao` com `{ "onibusId": "...", "motoristaId": "..." }`.
- Chatbot FAQ: `POST /api/suporte/chatbot` com `{ "pergunta": "..." }`. Respostas vêm de uma base de perguntas frequentes; dúvidas sem resposta são encaminhadas ao contato configurado.
- Termos: `GET /api/termos` apresenta o texto e versão atuais; usuário autenticado consulta aceite em `GET /api/profile/termos` e registra em `POST /api/profile/termos/aceite`. O aceite vigente é exigido para comprar passagem.
- Viagens: `GET /api/viagens?origem=...&destino=...` lista saídas publicadas. Administradores cadastram saídas e assentos em `POST /api/admin/viagens`. Usuários aceitam os termos e reservam assento em `POST /api/passagens` com `{ "viagemId": "...", "assento": 1 }`; o gateway gera Pix e o webhook confirma a passagem. `GET /api/passagens/minhas` consulta reservas e passagens.

As viagens e a lotação são cadastradas pela administração; a emissão resultante é um registro interno do OnBus. A integração com inventário, emissão e validação de bilhetes de uma operadora intermunicipal/interestadual exige contrato e API da operadora ou distribuidor. Sem essa integração, o registro interno não deve ser tratado como bilhete válido para embarque.

## Comandos

### Executar Backend

```bash
npm run dev
```

### Executar CLI (Testes)

```bash
npm run cli
```

### Resetar Banco de Dados

```bash
npm run setup
```

## CLI de Testes

Interface interativa para testar todos os fluxos do sistema:

| # | Função |
|---|---|
| 1 | Ver perfil |
| 2 | Solicitar cartão (Comum / Estudante / Idoso) |
| 3 | Listar cartões e saldos |
| 4 | Recarregar via Pix |
| 5 | Bloquear cartão |
| 6 | Solicitar segunda via |
| 7 | Simular catraca (embarque) |
| 8 | Ver histórico de transações |
| 9 | Consultar itinerários de Pelotas/RS |
| 10 | Simular confirmação de Pix via Webhook |
| 11 | Excluir conta (LGPD) |

## Estrutura

```
backend/
├── src/
│   ├── server.ts
│   ├── cli.ts
│   ├── database/
│   │   ├── connection.ts
│   │   ├── knexfile.ts
│   │   ├── setup.ts
│   │   ├── migrations/
│   │   └── seeds/
│   ├── middleware/
│   ├── routes/
│   └── services/
└── package.json
```

## Tecnologias

- Node.js + TypeScript
- Express.js
- Knex.js
- SQLite (dev) / PostgreSQL (prod)
- JWT
- bcryptjs
