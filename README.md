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
```

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
