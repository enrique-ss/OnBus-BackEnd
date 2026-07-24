# Funcionalidades do Sistema OnBus

Documentação completa das funcionalidades do backend e CLI do sistema OnBus, organizadas por tipo de usuário.

## 📋 Índice

- [Funcionalidades do Passageiro](#funcionalidades-do-passageiro)
- [Funcionalidades do Administrador](#funcionalidades-do-administrador)
- [Funcionalidades da Empresa Parceira](#funcionalidades-da-empresa-parceira)
- [Funcionalidades do Motorista](#funcionalidades-do-motorista)
- [Funcionalidades Comuns](#funcionalidades-comuns)
- [CLI de Testes](#cli-de-testes)
- [Segurança](#segurança)
- [Banco de Dados](#banco-de-dados)
- [API Endpoints](#api-endpoints)

---

## Autenticação

### Registro de Usuário

**Endpoint:** `POST /api/auth/register`

**Corpo da requisição:**
```json
{
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@email.com",
  "senha": "senha123",
  "tipo": "comum"
}
```

**Tipos de usuário:**
- `comum`: Passageiro padrão
- `admin`: Administrador com acesso a histórico de catracas
- `empresa`: Empresa parceira B2B
- `motorista`: Motorista vinculado à empresa

**Validações:**
- CPF deve ter 11 dígitos numéricos
- Email deve ser único no sistema
- Senha é hasheada com bcrypt (10 rounds)
- CPF deve ser único no sistema

**Resposta:**
```json
{
  "id": "uuid-v4",
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@email.com",
  "tipo": "comum",
  "status": "ativo",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Login

**Endpoint:** `POST /api/auth/login`

**Corpo da requisição:**
```json
{
  "email": "joao@email.com",
  "senha": "senha123"
}
```

**Processo:**
1. Busca usuário por email
2. Compara senha usando bcrypt
3. Gera token JWT (expira em 24h)
4. Retorna token e dados do usuário

**Resposta:**
```json
{
  "token": "jwt-token",
  "usuario": {
    "id": "uuid-v4",
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

---

## Gestão de Usuários

### Ver Perfil

**Endpoint:** `GET /api/profile` (requer autenticação)

**Resposta:**
```json
{
  "id": "uuid-v4",
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@email.com",
  "status": "ativo",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Excluir Conta (LGPD)

**Endpoint:** `DELETE /api/profile/lgpd` (requer autenticação)

**Processo:**
1. Verifica se usuário está autenticado
2. Exclui todos os cartões do usuário (CASCADE)
3. Exclui todas as transações dos cartões (CASCADE)
4. Exclui o usuário
5. Operação é irreversível

**Resposta:**
```json
{
  "message": "Conta excluída com sucesso conforme LGPD"
}
```

### Editar Perfil

**Endpoint:** `PUT /api/profile` (requer autenticação)

**Corpo da requisição:**
```json
{
  "nome": "João Silva Atualizado",
  "email": "joao.novo@email.com"
}
```

**Validações:**
- Campos são opcionais (apenas os enviados são atualizados)
- Email deve ser único no sistema (se alterado)

**Resposta:**
```json
{
  "id": "uuid-v4",
  "nome": "João Silva Atualizado",
  "cpf": "12345678901",
  "email": "joao.novo@email.com",
  "tipo": "comum",
  "status": "ativo",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

---

## Gestão de Cartões

### Solicitar Cartão

**Endpoint:** `POST /api/cartoes` (requer autenticação)

**Corpo da requisição:**
```json
{
  "tipo": "comum",
  "themeUrl": "https://exemplo.com/tema.png"
}
```

**Tipos de cartão:**
- `comum`: Tarifa R$ 5,00
- `estudante`: Tarifa R$ 2,50
- `idoso`: Gratuito

**Validações:**
- Usuário não pode ter mais de um cartão ativo
- `themeUrl` é opcional (NULL = tema padrão do tipo)

**Processo:**
1. Gera número do cartão (formato: 10.01.XXXXXX)
2. Gera UUID para o cartão
3. Salva no banco com saldo inicial R$ 0,00
4. Retorna dados do cartão

**Resposta:**
```json
{
  "id": "uuid-v4",
  "numero": "10.01.123456",
  "usuario_id": "uuid-v4",
  "tipo": "comum",
  "saldo": 0.00,
  "status": "ativo",
  "theme_url": "https://exemplo.com/tema.png",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Listar Cartões

**Endpoint:** `GET /api/cartoes` (requer autenticação)

**Resposta:**
```json
[
  {
    "id": "uuid-v4",
    "numero": "10.01.123456",
    "tipo": "comum",
    "saldo": 50.00,
    "status": "ativo",
    "theme_url": null
  }
]
```

### Bloquear Cartão

**Endpoint:** `POST /api/cartoes/:id/bloquear` (requer autenticação)

**Corpo da requisição:**
```json
{
  "cartaoId": "uuid-v4"
}
```

**Validações:**
- Cartão deve pertencer ao usuário autenticado
- Cartão deve estar ativo

**Processo:**
1. Busca cartão por ID e usuário
2. Altera status para 'bloqueado'
3. Mantém saldo intacto

**Resposta:**
```json
{
  "id": "uuid-v4",
  "numero": "10.01.123456",
  "status": "bloqueado",
  "saldo": 50.00
}
```

### Solicitar Segunda Via

**Endpoint:** `POST /api/cartoes/:id/segunda-via` (requer autenticação)

**Corpo da requisição:**
```json
{
  "cartaoId": "uuid-v4"
}
```

**Validações:**
- Cartão deve estar bloqueado
- Cartão deve pertencer ao usuário

**Processo:**
1. Cancela cartão antigo (status 'cancelado', saldo = 0)
2. Emite novo cartão com mesmo tipo
3. Transfere saldo do antigo para o novo
4. Registra transação de transferência
5. Mantém `theme_url` se existia

**Resposta:**
```json
{
  "id": "novo-uuid-v4",
  "numero": "10.01.789012",
  "tipo": "comum",
  "saldo": 50.00,
  "status": "ativo"
}
```

---

## Recargas via Pix

### Solicitar Recarga

**Endpoint:** `POST /api/cartoes/:id/recarregar` (requer autenticação)

**Corpo da requisição:**
```json
{
  "cartaoId": "uuid-v4",
  "valor": 50.00
}
```

**Validações:**
- Valor deve ser maior que zero
- Cartão deve estar ativo
- Cartão deve pertencer ao usuário

**Processo:**
1. Cria transação com status 'pendente'
2. Gera código Pix Copia e Cola (BR Code)
3. Não credita saldo imediatamente
4. Aguarda webhook de confirmação

**Resposta:**
```json
{
  "transacao": {
    "id": "uuid-v4",
    "cartao_id": "uuid-v4",
    "tipo": "recarga",
    "valor": 50.00,
    "status": "pendente",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "pixCopiaCola": "00020101021226870014br.gov.bcb.pix..."
}
```

### Listar Recargas Pendentes

**Endpoint:** `GET /api/transacoes/pendentes` (requer autenticação)

**Resposta:**
```json
[
  {
    "id": "uuid-v4",
    "cartao_id": "uuid-v4",
    "tipo": "recarga",
    "valor": 50.00,
    "status": "pendente",
    "created_at": "2024-01-01T10:00:00.000Z"
  }
]
```

**Processo:**
1. Busca todos os cartões do usuário
2. Busca transações de recarga com status 'pendente'
3. Ordena por data (mais recentes primeiro)
4. Retorna lista de pendentes

### Pagar Recarga Pendente

**Endpoint:** `POST /api/transacoes/:id/pagar` (requer autenticação)

**Validações:**
- Transação deve existir
- Transação deve estar 'pendente'
- Cartão deve pertencer ao usuário

**Processo:**
1. Busca transação por ID
2. Verifica se cartão pertence ao usuário
3. Credita saldo no cartão
4. Altera status da transação para 'confirmado'

**Resposta:**
```json
{
  "id": "uuid-v4",
  "cartao_id": "uuid-v4",
  "tipo": "recarga",
  "valor": 50.00,
  "status": "confirmado"
}
```

### Confirmar Recarga (Webhook)

**Endpoint:** `POST /api/webhooks/pagamentos` (requer assinatura HMAC)

**Corpo da requisição:**
```json
{
  "transacaoId": "uuid-v4",
  "valor": 50.00,
  "status": "confirmado"
}
```

**Validações:**
- Assinatura HMAC SHA-256 deve ser válida
- Transação deve existir e estar 'pendente'
- Valor deve ser idêntico ao da transação pendente

**Processo:**
1. Verifica assinatura do webhook
2. Busca transação por ID
3. Compara valores
4. Credita saldo no cartão
5. Altera status da transação para 'confirmado'

**Resposta:**
```json
{
  "id": "uuid-v4",
  "status": "confirmado"
}
```

### Fluxo de Recargas na CLI

Ao acessar a opção de recarga no CLI:

1. **Verificação automática:** O sistema verifica se existem recargas pendentes
2. **Exibição de pendentes:** Se houver, mostra lista numerada com valores e datas
3. **Seleção de pagamento:** Usuário digita o número da recarga para pagar ou 0 para criar nova
4. **Pagamento individual:** Se selecionar uma recarga, processa apenas aquela
5. **Nova recarga:** Se digitar 0, segue fluxo normal para criar nova recarga

---

## Validação de Embarque

### Processar Embarque

**Endpoint:** `POST /api/catraca/embarque`

**Corpo da requisição:**
```json
{
  "cartaoId": "uuid-v4",
  "catracaId": "COHAB"
}
```

**Validações:**
- Catraca deve existir e estar ativo
- Cartão deve existir
- Cartão deve estar ativo

**Processo:**
1. Busca tarifa baseada no tipo do cartão:
   - comum: R$ 5,00
   - estudante: R$ 2,50
   - idoso: R$ 0,00
2. Verifica saldo suficiente
3. Debita tarifa do saldo
4. Registra validação no histórico da catraca (JSON)
5. Registra validação no histórico do cartão (JSON)
6. Retorna resultado

**Resposta (sucesso):**
```json
{
  "autorizado": true,
  "saldoAnterior": 50.00,
  "saldoAtual": 45.00,
  "tarifa": 5.00,
  "mensagem": "Embarque Autorizado!",
  "cartaoNumero": "10.01.123456"
}
```

**Resposta (falha - saldo insuficiente):**
```json
{
  "autorizado": false,
  "saldoAnterior": 3.00,
  "saldoAtual": 3.00,
  "tarifa": 5.00,
  "mensagem": "Acesso negado: Saldo insuficiente.",
  "cartaoNumero": "10.01.123456"
}
```

**Resposta (falha - cartão bloqueado):**
```json
{
  "autorizado": false,
  "saldoAnterior": 50.00,
  "saldoAtual": 50.00,
  "tarifa": 0,
  "mensagem": "Acesso negado: Cartão bloqueado.",
  "cartaoNumero": "10.01.123456"
}
```

---

## Histórico de Validações

### Histórico do Cartão

**Endpoint:** `GET /api/cartoes/:id/historico` (requer autenticação)

**Resposta:**
```json
[
  {
    "id": "uuid-v4",
    "catraca_id": "COHAB",
    "catraca_nome": "Cohab / Tablada (Laranjal)",
    "tarifa": 5.00,
    "autorizado": "sim",
    "mensagem": "Embarque Autorizado!",
    "dia": "segunda",
    "horario": "14:30",
    "created_at": "2024-01-01T14:30:00.000Z"
  }
]
```

**Armazenamento:**
- Histórico é armazenado em JSON no campo `cartoes.historico`
- Cada validação registra: catraca, linha, dia, horário, tarifa e status

### Histórico de Recargas

**Endpoint:** `GET /api/cartoes/:id/transacoes` (requer autenticação)

**Resposta:**
```json
[
  {
    "id": "uuid-v4",
    "cartao_id": "uuid-v4",
    "tipo": "recarga",
    "valor": 50.00,
    "status": "confirmado",
    "created_at": "2024-01-01T10:00:00.000Z"
  }
]
```

**Tipos de transação:**
- `recarga`: Entrada de dinheiro (Pix)

**Status:**
- `pendente`: Aguardando confirmação do Pix
- `confirmado`: Processado com sucesso
- `falho`: Erro no processamento

---

## Catracas

### Listar Catracas

**Endpoint:** `GET /api/catracas`

**Resposta:**
```json
[
  {
    "id": "COHAB",
    "nome": "Cohab / Tablada (Laranjal)",
    "status": "ativo"
  },
  {
    "id": "FRAGATA",
    "nome": "Fragata via Guabiroba",
    "status": "ativo"
  }
]
```

### Obter Catraca

**Endpoint:** `GET /api/catracas/:id`

**Resposta:**
```json
{
  "id": "COHAB",
  "nome": "Cohab / Tablada (Laranjal)",
  "status": "ativo"
}
```

### Obter Tarifas

**Endpoint:** `GET /api/catracas/tarifas`

**Resposta:**
```json
{
  "comum": 5.00,
  "estudante": 2.50,
  "idoso": 0.00
}
```

### Histórico de Validações da Catraca

**Endpoint:** `GET /api/catracas/:id/validacoes` (apenas admin)

**Validações:**
- Requer autenticação
- Usuário deve ser do tipo 'admin'

**Resposta:**
```json
[
  {
    "id": "uuid-v4",
    "cartao_id": "uuid-v4",
    "cartao_numero": "10.01.123456",
    "tarifa": 5.00,
    "autorizado": "sim",
    "mensagem": "Embarque Autorizado!",
    "linha": "Cohab / Tablada (Laranjal)",
    "dia": "segunda",
    "horario": "14:30",
    "created_at": "2024-01-01T14:30:00.000Z"
  }
]
```

### Sincronizar Transações Offline

**Endpoint:** `POST /api/catraca/sincronizar`

**Corpo da requisição:**
```json
{
  "catracaId": "COHAB",
  "transacoes": [
    {
      "id": "uuid-v4",
      "cartao_id": "uuid-v4",
      "valor": 5.00,
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Processo:**
1. Valida se catraca existe e está ativa
2. Para cada transação:
   - Verifica se cartão existe
   - Debita saldo
   - Registra validação no histórico da catraca (JSON)
   - Registra validação no histórico do cartão (JSON)
3. Retorna quantidade processada e erros

**Resposta:**
```json
{
  "processadas": 1,
  "erros": []
}
```

---

## Itinerários

### Consultar Itinerários de Pelotas/RS

**Endpoint:** `GET /api/itinerarios`

**Resposta:**
```json
[
  {
    "linha": "101",
    "nome": "Circular Centro",
    "origem": "Terminal Central",
    "destino": "Terminal Central",
    "horarios": ["06:00", "06:30", "07:00"]
  }
]
```

---

## Webhooks

### Assinatura HMAC SHA-256

Todos os webhooks são assinados usando HMAC SHA-256 para garantir autenticidade:

```typescript
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(body))
  .digest('hex');
```

**Cabeçalho:**
```
X-Webhook-Signature: <signature>
```

### Webhook de Pix

**Endpoint:** `POST /api/webhooks/pagamentos`

**Validações:**
- Assinatura deve ser válida
- Transação deve estar pendente
- Valor deve ser idêntico

---

## LGPD

### Direito ao Esquecimento

O sistema implementa exclusão permanente em cascata conforme LGPD:

1. **Usuário excluído:**
   - Todos os cartões são excluídos (CASCADE)
   - Todas as transações dos cartões são excluídas (CASCADE)

2. **Cartão cancelado:**
   - Histórico de transações é mantido
   - Saldo é zerado
   - Status alterado para 'cancelado'

3. **Segunda via:**
   - Cartão antigo é cancelado
   - Novo cartão é emitido
   - Saldo é transferido
   - Transação de transferência é registrada

---

## CLI de Testes

### Funcionalidades

A CLI permite testar todos os fluxos do sistema sem dependência do frontend:

| # | Função | Descrição |
|---|--------|-----------|
| 1 | Ver perfil | Exibe dados do usuário autenticado |
| 2 | Editar perfil | Atualiza nome e email do usuário |
| 3 | Solicitar cartão | Emite novo cartão (Comum/Estudante/Idoso) |
| 4 | Listar cartões | Mostra todos os cartões e saldos |
| 5 | Recarregar via Pix | Verifica pendentes, gera código Pix ou paga pendentes |
| 6 | Bloquear cartão | Bloqueia cartão ativo |
| 7 | Solicitar segunda via | Emite novo cartão com saldo transferido |
| 8 | Simular catraca | Seleciona destino e simula aproximação do cartão |
| 9 | Ver histórico do cartão | Mostra histórico de validações do cartão |
| 10 | Ver histórico da catraca | Seleciona catraca e mostra validações (apenas admin) |
| 11 | Consultar itinerários | Lista linhas de ônibus de Pelotas |
| 12 | Simular webhook | Simula confirmação de Pix |
| 13 | Excluir conta | Exclui conta conforme LGPD |
| 14 | Recuperar senha | Simula envio de email de recuperação (menu inicial) |

### Menus por Tipo de Usuário

**Menu Inicial (Deslogado):**
- Registrar novo passageiro
- Entrar
- Recuperar senha
- Consultar itinerários
- Sair

**Menu Passageiro Comum:**
- Meu Perfil
- Gerenciar Cartões
- Simular Embarque (Catraca)
- Consultar Itinerários de Pelotas
- Excursões e Viagens Disponíveis
- Sair

**Menu Administrador:**
- Meu Perfil
- Monitoramento de Catracas
  - Monitorar Status das Catracas (ativo/inativo, empresas vinculadas)
  - Ver Histórico da Catraca (validações completas)
- Auditoria de Transações Financeiras
  - Listar todas as transações do sistema
  - Ver resumo financeiro (total, taxas, líquido)
  - Dados enriquecidos com usuário e cartão
- Auditoria de Logs do Sistema
  - Ver estatísticas (total, por nível, por origem)
  - Listar logs recentes com filtros
  - Dados enriquecidos com usuário e rota
- Sair

**Menu Empresa Parceira:**
- Meu Perfil
- Painel de Controle da Empresa
- Sair

**Painel de Controle da Empresa:**
- Cadastrar Veículo na Frota
- Listar Frota
- Cadastrar Motorista
- Listar Motoristas
- Anunciar Nova Excursão
- Voltar ao Menu Principal

**Menu Motorista:**
- Meu Perfil
- Ver Meus Horários
- Ver Minhas Tarefas
- Sair

### Execução

```bash
npm run cli
```

### Configuração

O CLI seleciona catracas dinamicamente do banco. Não há necessidade de configurar ID hardcoded.

---

## Segurança

### Autenticação

- Tokens JWT com expiração de 24 horas
- Senhas hasheadas com bcrypt (10 rounds)
- Middleware de autenticação em rotas protegidas

### Webhooks

- Assinatura HMAC SHA-256
- Validação de timing attacks usando `timingSafeEqual`
- Segredo configurado via `WEBHOOK_SECRET`

### LGPD

- Exclusão permanente em cascata
- Sem recuperação de dados excluídos
- Conformidade com Lei Geral de Proteção de Dados

---

## Banco de Dados

### Tabelas

**usuarios:**
- id (VARCHAR 36)
- nome (VARCHAR 100)
- cpf (VARCHAR 11, UNIQUE)
- email (VARCHAR 100, UNIQUE)
- senha (VARCHAR 255)
- tipo (VARCHAR 20) - comum/admin/empresa/motorista
- status (VARCHAR 20)
- clube_status (VARCHAR 20) - inativo/ativo
- clube_expira_em (TIMESTAMP, NULLABLE)
- cnh (VARCHAR 20, NULLABLE, UNIQUE) - CNH do motorista
- empresa_id (VARCHAR 36, FK, NULLABLE) - Empresa do motorista
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**cartoes:**
- id (VARCHAR 36)
- numero (VARCHAR 20, UNIQUE)
- usuario_id (VARCHAR 36, FK)
- tipo (VARCHAR 20)
- saldo (DECIMAL 8,2)
- status (VARCHAR 20)
- theme_url (VARCHAR 255, NULLABLE)
- historico (TEXT, NULLABLE) - JSON com histórico de validações (catracas que passou)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**transacoes:**
- id (VARCHAR 36)
- cartao_id (VARCHAR 36, FK)
- tipo (VARCHAR 20) - apenas 'recarga'
- valor (DECIMAL 8,2)
- taxa_servico (DECIMAL 8,2) - Taxa de conveniência (padrão 0.00)
- status (VARCHAR 20)
- created_at (TIMESTAMP)

**catracas:**
- id (VARCHAR 50) - ID da linha (ex: COHAB, FRAGATA, LARANJAL, AEROPORTO)
- nome (VARCHAR 100) - Nome da linha (ex: "Cohab / Tablada (Laranjal)")
- status (VARCHAR 20)
- empresa_id (VARCHAR 36, FK, NULLABLE) - Empresa parceira vinculada (B2B)

**historicos:**
- id (VARCHAR 36)
- cartao_id (VARCHAR 36, FK)
- catraca_id (VARCHAR 50, FK)
- cartao_numero (VARCHAR 20) - Número do cartão (para consulta rápida)
- catraca_nome (VARCHAR 100) - Nome da linha (para consulta rápida)
- tarifa (DECIMAL 8,2)
- autorizado (VARCHAR 10) - sim/nao
- mensagem (VARCHAR 255, NULLABLE)
- dia (VARCHAR 20) - Dia da semana
- horario (VARCHAR 5) - Horário HH:MM
- created_at (TIMESTAMP)

**frotas:**
- id (VARCHAR 36)
- empresa_id (VARCHAR 36, FK)
- placa (VARCHAR 10, UNIQUE)
- modelo (VARCHAR 100)
- ano (INT)
- status (VARCHAR 20) - ativo/manutencao
- created_at (TIMESTAMP)

**excursoes:**
- id (VARCHAR 36)
- empresa_id (VARCHAR 36, FK)
- titulo (VARCHAR 100)
- destino (VARCHAR 100)
- preco (DECIMAL 8,2)
- patrocinio_valor (DECIMAL 8,2) - Valor pago para destacar anúncio
- status (VARCHAR 20) - ativo/cancelado/finalizado
- created_at (TIMESTAMP)

**logs:**
- id (VARCHAR 36)
- nivel (VARCHAR 20) - info/warning/error/critical
- origem (VARCHAR 100) - auth/catraca/pagamento/etc
- mensagem (VARCHAR 500)
- dados (JSON, NULLABLE) - Dados adicionais
- usuario_id (VARCHAR 36, FK, NULLABLE)
- ip (VARCHAR 50, NULLABLE)
- metodo (VARCHAR 10, NULLABLE) - GET/POST/PUT/DELETE
- rota (VARCHAR 255, NULLABLE)
- status_code (INT, NULLABLE)
- created_at (TIMESTAMP)

### Relacionamentos

- cartoes.usuario_id → usuarios.id (CASCADE)
- transacoes.cartao_id → cartoes.id (CASCADE)
- historicos.cartao_id → cartoes.id (CASCADE)
- historicos.catraca_id → catracas.id (CASCADE)
- catracas.empresa_id → usuarios.id (CASCADE)
- frotas.empresa_id → usuarios.id (CASCADE)
- excursoes.empresa_id → usuarios.id (CASCADE)
- usuarios.empresa_id → usuarios.id (CASCADE) - Motoristas vinculados a empresas
- logs.usuario_id → usuarios.id (SET NULL)

---

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login

### Usuários
- `GET /api/profile` - Ver perfil (auth)
- `PUT /api/profile` - Editar perfil (auth)
- `DELETE /api/profile/lgpd` - Excluir conta (auth)

### Cartões
- `POST /api/cartoes` - Solicitar cartão (auth + passageiro)
- `GET /api/cartoes` - Listar cartões (auth + passageiro)
- `POST /api/cartoes/:id/bloquear` - Bloquear cartão (auth + passageiro)
- `POST /api/cartoes/:id/segunda-via` - Solicitar segunda via (auth + passageiro)
- `POST /api/cartoes/:id/recarregar` - Recarregar via Pix (auth + passageiro)
- `GET /api/cartoes/:id/transacoes` - Listar recargas do cartão (auth + passageiro)
- `GET /api/cartoes/:id/historico` - Listar histórico de validações do cartão (auth + passageiro)

### Transações
- `GET /api/transacoes/pendentes` - Listar recargas pendentes (auth + passageiro)
- `POST /api/transacoes/:id/pagar` - Pagar recarga pendente (auth + passageiro)

### Catracas
- `GET /api/catracas` - Listar todas as catracas (linhas)
- `GET /api/catracas/:id` - Obter catraca específica
- `GET /api/catracas/:id/validacoes` - Listar histórico de validações da catraca (auth + admin)
- `GET /api/catracas/tarifas` - Obter tarifas
- `POST /api/catraca/embarque` - Processar embarque
- `POST /api/catraca/sincronizar` - Sincronizar offline

### Itinerários
- `GET /api/itinerarios` - Consultar itinerários
- `GET /api/itinerarios/:id` - Obter horários por linha

### Serviços Adicionais
- `POST /api/profile/clube` - Assinar clube de benefícios (auth + passageiro)
- `POST /api/empresa/frotas` - Cadastrar veículo na frota (auth + empresa)
- `GET /api/empresa/frotas` - Listar frota da empresa (auth + empresa)
- `POST /api/empresa/motoristas` - Cadastrar motorista (auth + empresa)
- `GET /api/empresa/motoristas` - Listar motoristas da empresa (auth + empresa)
- `POST /api/empresa/excursoes` - Anunciar excursão (auth + empresa)
- `GET /api/excursoes` - Listar excursões disponíveis
- `GET /api/motorista/horarios` - Ver horários de trabalho (auth + motorista)
- `GET /api/motorista/tarefas` - Ver tarefas/viagens (auth + motorista)

### Admin - Auditoria e Monitoramento
- `GET /api/admin/transacoes` - Listar todas as transações com dados enriquecidos (auth + admin)
- `GET /api/admin/logs` - Listar logs do sistema com filtros (auth + admin)
- `GET /api/admin/logs/estatisticas` - Obter estatísticas de logs (auth + admin)

### Webhooks
- `POST /api/webhooks/pagamentos` - Confirmar Pix

---

## Funcionalidades de Escalabilidade (Monetização e Gestão)

### 🌟 Clube de Benefícios OnBus
- `POST /api/profile/clube` - Assinar clube de benefícios. Ativa o status premium do usuário no banco de dados e define a data de expiração da assinatura de 1 ano.

### 🏢 Painel de Controle B2B (Empresa Parceira)
- `POST /api/empresa/frotas` - Cadastrar novo ônibus na frota da empresa (requer autenticação de conta do tipo `'empresa'`).
- `GET /api/empresa/frotas` - Listar todos os veículos cadastrados na frota da empresa parceira autenticada.
- `POST /api/empresa/motoristas` - Cadastrar novo motorista vinculado à empresa parceira (requer tipo `'empresa'`).
- `GET /api/empresa/motoristas` - Listar motoristas cadastrados pela empresa parceira.

### ✈️ Excursões e Viagens
- `POST /api/empresa/excursoes` - Publicar nova excursão / viagem privada (requer tipo `'empresa'`). O campo `patrocinio_valor` opcional permite pagar um destaque.
- `GET /api/excursoes` - Listar todas as excursões ativas. Ordenado automaticamente por `patrocinio_valor` de forma decrescente para priorizar no topo os anúncios patrocinados.

### 💵 Taxa de Conveniência
- O backend calcula automaticamente uma taxa de 2% sobre o valor solicitado nas recargas via Pix, persistida na coluna `taxa_servico` da tabela `transacoes`.

### 🚌 Motorista (Funcionalidades do Trabalhador)
- `GET /api/motorista/horarios` - Ver horários de trabalho das linhas da empresa (auth + motorista)
- `GET /api/motorista/tarefas` - Ver tarefas/viagens programadas (auth + motorista)

**Horários de Trabalho:**
- Busca linhas associadas à empresa do motorista
- Retorna horários de cada linha disponível

**Tarefas:**
- Lista viagens programadas associadas à empresa do motorista
- Mostra horários, veículos e status de cada tarefa

