# 4.1 Componentes de Software e Frameworks

O ecossistema OnBus adota o paradigma de **Orientação a Objetos (POO)**.

> [!NOTE]
> **Centralização no Backend:** Todos os processos e regras de negócio do projeto residem estritamente no backend. O frontend atua puramente como uma camada de apresentação (view), renderizando os dados processados e estruturados pelas APIs.

O Backend utiliza TypeScript para garantir a robustez das regras de negócio, enquanto o Frontend utiliza JavaScript para agilidade na manipulação de interface.

## Hospedagem e Deploy

- Render (Node.js)
- Pipelines de CI/CD automatizados via GitHub

## Backend

- Node.js
- Express.js
- TypeScript

## Frontend

- HTML5
- CSS3
- JavaScript (ES6+)
- Manipulação dinâmica do DOM

## Query Builder

- Knex.js
- Abstração SQL unificada entre bancos locais (SQLite) e remotos (PostgreSQL/Supabase)
- A troca de ambiente (desenvolvimento → produção) é feita apenas no `knexfile.ts`; migrations, seeds e services permanecem idênticos

## Comunicação

- APIs REST (JSON)
- WebSockets para eventos em tempo real

## Segurança

- JWT (autenticação stateless)
- CORS
- Hashing de senhas com bcryptjs

## Animações e Visualização

- GSAP para microinterações
- Three.js para renderização 3D

## Versionamento

- Git
- GitHub

# 4.2 Arquitetura de Dados: Sistema Local vs. Online

A persistência de dados é distribuída para garantir resiliência operacional e continuidade do serviço mesmo em cenários de indisponibilidade de rede.

## 1. Ambiente Local (Desenvolvimento e Contingência)

### Banco de Dados

- **SQLite** (`onbus.db`) — banco embutido, sem servidor, sem configuração
- Gerenciado via **better-sqlite3** + **Knex.js**

### Mecanismo

- Arquivo de banco gerado automaticamente em `backend/onbus.db` ao rodar `npm run setup`
- Nenhum processo de servidor de banco de dados é necessário
- Consultas executadas via Knex.js com as mesmas queries que serão usadas em produção

### Comportamento

- Processamento do débito em menos de 1 segundo
- Operação totalmente offline
- Armazenamento local de transações da catraca em `catraca_offline.json`
- Sincronização em lote com a nuvem após restabelecimento da conectividade

## 2. Ambiente Online (Nuvem Centralizada)

### Banco de Dados

- Supabase (PostgreSQL gerenciado)

### Comportamento

- Base centralizadora do ecossistema OnBus
- Processamento de cadastros
- Processamento de transações financeiras via webhooks
- Atualização de dados corporativos em tempo real
- Integração através da API Node.js hospedada na Render

# 4.3 Modelagem Orientada a Objetos (POO) em TypeScript

As regras de negócio são encapsuladas em classes tipadas, promovendo reutilização, manutenção simplificada e separação de responsabilidades.

## Usuario

### Atributos

- UUID
- Nome
- Status
- Dados cadastrais
- Credenciais

### Métodos

- `autenticar()`
- `atualizarPerfil()`
- `solicitarExclusaoLGPD()`

## CartaoTransporte (Classe Abstrata)

Classe base para especializações do sistema.

### Classes Derivadas

- `CartaoEstudante`
- `CartaoIdoso`

### Métodos

- Métodos de débito sobrescritos para aplicação de:
  - Meia-tarifa
  - Gratuidade

### Atributos

- `layoutBaseId`
- `customThemeUrl`

## Transacao

Responsável pelo fluxo financeiro.

### Métodos

- `processarPagamento()`
- `gerarComprovante()`

## ValidadorCatraca

Responsável pela operação embarcada nos veículos.

### Métodos

- `autorizarEmbarque()`
- `sincronizarComNuvem()`

# 4.4 Matriz de Testes (QA) e Segurança da Informação

## Estratégia de Testes Automatizados

### Testes Unitários e de Integração

Validação dos principais componentes do sistema:

- Cálculo de saldo
- Hashing de senhas
- Expiração de tokens
- Endpoints da API REST
- Regras de negócio

**Ferramenta:** CLI interativa para simulação de fluxos e validação de endpoints.

### Testes de Performance

Homologação de concorrência e capacidade operacional nos serviços hospedados na Render e Supabase.

### Testes de Latência

Execução de testes de estresse na camada local da catraca utilizando Knex.js para assegurar o requisito de resposta inferior a 1 segundo.

# Segurança e Conformidade (LGPD)

## Camada de Rede

Todo o tráfego da aplicação deve operar exclusivamente sob:

- HTTPS
- TLS

## Tokenização

Dados sensíveis de cartões de crédito são tokenizados pelo gateway de pagamento e não são armazenados nem processados pela base local do sistema.

## Conformidade com a LGPD

Implementação do método:

```ts
solicitarExclusaoLGPD()
```

O método dispara rotinas de *hard delete* nas tabelas do Supabase para remoção definitiva dos dados pessoais do usuário, atendendo ao direito de exclusão previsto pela legislação.

## Validações e Regras de Negócio Críticas (Backend)

Para garantir integridade física, lógica e de conformidade do banco central, o backend executa as seguintes validações:

1. **Validação de CPF e E-mail:**
   - CPFs fornecidos no cadastro de usuários e perfis passam pelo algoritmo oficial de verificação matemática de 11 dígitos (dígitos verificadores).
   - E-mails são validados contra expressões regulares sintáticas.
2. **Autenticação de Equipamentos (Validadores):**
   - Requisições enviadas para as rotas `/validador/embarque` e `/validador/sincronizar` validam se o identificador `validadorId` do dispositivo existe no banco de dados central e se o seu status é `ativo`.
3. **Limitação de Cartão Ativo (Regra de Negócio):**
   - Cada usuário está limitado a possuir no máximo **um cartão ativo simultaneamente** no sistema. Para emitir ou reemitir um novo cartão, qualquer cartão ativo anterior precisa ser explicitamente bloqueado ou cancelado.