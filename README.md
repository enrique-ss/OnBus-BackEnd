# 🚌 OnBus - Sistema Inteligente de Bilhetagem e Mobilidade Urbana

O **OnBus** é uma plataforma Full Stack de bilhetagem eletrônica para transporte coletivo urbano, inspirada no ecossistema de mobilidade de Pelotas/RS.

O sistema moderniza a experiência de passageiros e operadores do transporte público, com gestão de cartões físicos e digitais, recargas via Pix, consulta de saldo, validação de embarque e monitoramento operacional.

Sua arquitetura híbrida permite que os validadores operem mesmo sem conexão com a internet, sincronizando automaticamente com a nuvem quando a conectividade for restabelecida.

---

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** (versão 18 ou superior) — [Baixe aqui](https://nodejs.org/)
- **VS Code** ou outro editor de código
- **Navegador atualizado** (Chrome, Edge ou Firefox)

> [!NOTE]
> Nenhum servidor de banco de dados é necessário. O OnBus usa **SQLite** localmente — o banco é criado automaticamente como um arquivo `onbus.db` na pasta `backend/`.

---

## 🚀 Instalação

Clone o repositório:

```bash
git clone https://github.com/T4vinh0h/Projeto-OnBus.git
cd Projeto-OnBus
```

Instale as dependências e crie o `.env` (na raiz do projeto):

```bash
npm install
cp .env.example .env
```

> [!NOTE]
> O `npm install` já prepara o banco SQLite local automaticamente (cria o `backend/onbus.db` com as tabelas e os dados iniciais, caso ainda não exista). Para rodar localmente, **só é preciso `npm install` + copiar o `.env`** — sem editar nada.

---

## ⚙️ Configuração

O `.env` fica na **raiz do projeto**. Para rodar **localmente**, basta copiar o modelo e usar como está — ele já vem pronto para SQLite, sem precisar editar nada:

```bash
cp .env.example .env
```

Para rodar **online (produção)** com Supabase/PostgreSQL, mude `NODE_ENV` para `production` e preencha a `DATABASE_URL` (e as variáveis `SUPABASE_*`, se for usá-las) no seu `.env`.

### Variáveis de ambiente (resumo)

```env
# Ambiente: development = SQLite local | production = PostgreSQL/Supabase
NODE_ENV=development
PORT=3000

# Autenticação / segurança (troque por valores fortes em produção)
JWT_SECRET=sua_chave_jwt
WEBHOOK_SECRET=sua_chave_webhook

# Produção/online (deixar vazio em desenvolvimento)
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 📦 Comandos

### Configurar Banco de Dados

O banco é preparado automaticamente no `npm install`. Use este comando (na raiz) apenas se quiser **recriar/resetar** o banco do zero:

```bash
npm run setup
```

O que faz:
- Cria o arquivo `backend/onbus.db` (SQLite)
- Executa as migrations (cria as tabelas)
- Popula com dados iniciais (seeds)

> [!WARNING]
> Este comando apaga todos os dados existentes no banco.

---

### Executar Backend

```bash
npm run dev
```

Inicia o servidor Express em `http://localhost:3000` com hot-reload automático.

---

### Executar CLI (Interface de Testes)

```bash
npm run cli
```

Abre a interface interativa no terminal para testar todos os fluxos do sistema sem depender do frontend.

---

### Executar Frontend

```bash
cd frontend
npm run web
```

Disponibiliza a interface em `http://localhost:5173`.

---

## 🌐 Acesso ao Sistema

| Serviço | URL |
|---|---|
| Backend (API REST) | `http://localhost:3000` |
| Frontend | `http://localhost:5173` |

---

## 🏗️ Arquitetura

> [!IMPORTANT]
> **Backend First:** Toda lógica de negócio, validações de segurança e processamento de dados rodam exclusivamente no backend. O frontend é uma camada de apresentação pura — renderiza dados e captura interações do usuário.

### Banco Local (SQLite)

Usado durante o desenvolvimento. Banco embutido, sem servidor, sem configuração. O arquivo `onbus.db` é criado automaticamente.

### Banco de Produção (Supabase / PostgreSQL)

Centraliza e sincroniza os dados em produção. Para migrar do SQLite para o Supabase, apenas as variáveis de ambiente mudam — o código de migrations, services e routes permanece idêntico graças ao Knex.js.

### Backend

API REST em Node.js + TypeScript com Express.js, responsável por autenticação, regras de negócio, integração de pagamentos e comunicação entre ambientes.

### Frontend

Interface para interação dos usuários com o sistema.

### Comunicação

- REST API
- WebSockets
- Webhooks (HMAC SHA-256)

---

## 📂 Estrutura do Projeto

```text
OnBus/
├── backend/
│   ├── .env                    # Variáveis de ambiente (não commitar)
│   ├── .env.example            # Modelo de configuração
│   ├── onbus.db                # Banco SQLite (gerado após npm run setup)
│   ├── package.json
│   └── src/
│       ├── server.ts           # Ponto de entrada do servidor
│       ├── cli.ts              # CLI de testes interativa
│       ├── database/
│       │   ├── connection.ts   # Instância Knex + wrappers de tabela
│       │   ├── knexfile.ts     # Configuração do Knex (SQLite / PostgreSQL)
│       │   ├── setup.ts        # Script de migrations e seeds
│       │   ├── migrations/     # DDL das tabelas (Knex)
│       │   └── seeds/          # Dados iniciais
│       ├── middleware/
│       │   └── authMiddleware.ts
│       ├── routes/
│       │   └── routes.ts       # Todas as rotas da API
│       └── services/
│           ├── CartaoService.ts
│           ├── UsuarioService.ts
│           ├── ValidadorService.ts
│           ├── HorarioService.ts
│           └── WebhookService.ts
│
├── frontend/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── scripts/
│       ├── services/
│       └── styles/
│
├── docs/                       # Documentação detalhada do projeto
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🛠️ Tecnologias Utilizadas

### Backend

| Tecnologia | Função |
|---|---|
| Node.js + TypeScript | Runtime e tipagem estática |
| Express.js | Framework HTTP |
| Knex.js | Query builder (SQLite ↔ PostgreSQL sem reescrever código) |
| better-sqlite3 | Driver SQLite local (desenvolvimento) |
| JWT | Autenticação stateless |
| bcryptjs | Hash de senhas |

### Banco de Dados

| Ambiente | Banco |
|---|---|
| Desenvolvimento | SQLite (`onbus.db`) |
| Produção | Supabase (PostgreSQL) |

> A troca de ambiente é transparente — apenas o `knexfile.ts` muda.

### Frontend

- HTML5, CSS3, JavaScript (ES6+)
- GSAP (animações)
- Three.js (renderização 3D)

### Comunicação

- REST API (JSON)
- WebSockets (eventos em tempo real)
- Webhooks com assinatura HMAC SHA-256

### Infraestrutura

- Render (deploy do backend)
- Supabase (banco de dados em produção)
- GitHub + CI/CD

---

## 🧪 CLI de Testes

A validação do backend é feita por uma CLI interativa que simula todos os fluxos sem depender do frontend:

```bash
cd backend
npm run cli
```

Funcionalidades disponíveis na CLI:

| # | Função |
|---|---|
| 1 | Ver perfil |
| 2 | Solicitar cartão (Comum / Estudante / Idoso) |
| 3 | Listar cartões e saldos |
| 4 | Recarregar via Pix (gera código Copia e Cola) |
| 5 | Bloquear cartão |
| 6 | Solicitar segunda via |
| 7 | Simular catraca (embarque online ou offline) |
| 8 | Ver histórico de transações |
| 9 | Alternar modo online/offline do validador |
| 10 | Sincronizar fila de transações offline |
| 11 | Consultar itinerários de Pelotas/RS |
| 12 | Simular confirmação de Pix via Webhook |
| 13 | Excluir conta (LGPD) |

---

## 🔐 Segurança

- **JWT** — tokens de autenticação stateless com expiração
- **bcryptjs** — hash de senhas com 10 rounds de salt
- **HMAC SHA-256** — assinatura de webhooks resistente a adulteração
- **timingSafeEqual** — comparação de assinaturas resistente a timing attacks
- **LGPD Hard Delete** — exclusão permanente em cascata de todos os dados do usuário

---

## 📚 Documentação

Documentação completa disponível em `docs/`:

- Arquitetura do sistema
- Requisitos funcionais e não funcionais
- Modelagem de dados
- Planejamento do produto
- UX/UI
- Estratégia de testes
- Segurança e LGPD
- Roadmap
- Governança e processos

---

## 👥 Equipe

| Nome | Área |
|---|---|
| **Julia Conceição** | UX/UI Design, prototipação, fluxos e acessibilidade |
| **Otávio Santos** | Desenvolvimento Frontend |
| **Enrique Silveira** | Arquitetura Backend, banco de dados, APIs e segurança |
| **Lucas Moreira** | Backend, integração de módulos e QA |
