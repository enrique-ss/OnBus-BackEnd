# Funcionalidades do Sistema OnBus

Documentação completa das funcionalidades do backend e CLI do sistema OnBus.

## 📋 Índice

- [Autenticação](#autenticação)
- [Gestão de Usuários](#gestão-de-usuários)
- [Gestão de Cartões](#gestão-de-cartões)
- [Recargas via Pix](#recargas-via-pix)
- [Validação de Embarque](#validação-de-embarque)
- [Histórico de Transações](#histórico-de-transações)
- [Validadores](#validadores)
- [Itinerários](#itinerários)
- [Webhooks](#webhooks)
- [LGPD](#lgpd)

---

## Autenticação

### Registro de Usuário

**Endpoint:** `POST /usuarios/registrar`

**Corpo da requisição:**
```json
{
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@email.com",
  "senha": "senha123"
}
```

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
  "status": "ativo",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Login

**Endpoint:** `POST /usuarios/login`

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

**Endpoint:** `GET /usuarios/perfil` (requer autenticação)

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

**Endpoint:** `DELETE /usuarios/conta` (requer autenticação)

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

---

## Gestão de Cartões

### Solicitar Cartão

**Endpoint:** `POST /cartoes` (requer autenticação)

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

**Endpoint:** `GET /cartoes` (requer autenticação)

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

**Endpoint:** `POST /cartoes/bloquear` (requer autenticação)

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

**Endpoint:** `POST /cartoes/segunda-via` (requer autenticação)

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

**Endpoint:** `POST /cartoes/recarregar` (requer autenticação)

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

**Endpoint:** `GET /transacoes/pendentes` (requer autenticação)

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

**Endpoint:** `POST /transacoes/:id/pagar` (requer autenticação)

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

**Endpoint:** `POST /webhook/pix` (requer assinatura HMAC)

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

**Endpoint:** `POST /validador/embarque`

**Corpo da requisição:**
```json
{
  "cartaoId": "uuid-v4",
  "validadorId": "1203"
}
```

**Validações:**
- Validador deve existir e estar ativo
- Cartão deve existir
- Cartão deve estar ativo

**Processo:**
1. Busca tarifa baseada no tipo do cartão:
   - comum: R$ 5,00
   - estudante: R$ 2,50
   - idoso: R$ 0,00
2. Verifica saldo suficiente
3. Debita tarifa do saldo
4. Registra transação de débito
5. Retorna resultado

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

## Histórico de Transações

### Listar Transações

**Endpoint:** `GET /transacoes` (requer autenticação)

**Resposta:**
```json
[
  {
    "id": "uuid-v4",
    "cartao_id": "uuid-v4",
    "tipo": "debito",
    "valor": 5.00,
    "status": "confirmado",
    "local_validador_id": "1203",
    "created_at": "2024-01-01T12:00:00.000Z"
  },
  {
    "id": "uuid-v4",
    "cartao_id": "uuid-v4",
    "tipo": "recarga",
    "valor": 50.00,
    "status": "confirmado",
    "local_validador_id": "WEB_PIX",
    "created_at": "2024-01-01T10:00:00.000Z"
  }
]
```

**Tipos de transação:**
- `recarga`: Entrada de dinheiro (Pix)
- `debito`: Passagem na catraca

**Status:**
- `pendente`: Aguardando confirmação do Pix
- `confirmado`: Processado com sucesso
- `falho`: Erro no processamento

---

## Validadores

### Obter Validador

**Endpoint:** `GET /api/validadores/:id`

**Resposta:**
```json
{
  "id": "1203",
  "status": "ativo"
}
```

### Obter Tarifas

**Endpoint:** `GET /api/validadores/tarifas`

**Resposta:**
```json
{
  "comum": 5.00,
  "estudante": 2.50,
  "idoso": 0.00
}
```

### Sincronizar Transações Offline

**Endpoint:** `POST /api/validador/sincronizar`

**Corpo da requisição:**
```json
{
  "transacoes": [
    {
      "id": "uuid-v4",
      "cartao_id": "uuid-v4",
      "tipo": "debito",
      "valor": 5.00,
      "local_validador_id": "1203",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Processo:**
1. Valida se validador existe e está ativo
2. Para cada transação:
   - Verifica se já existe no banco
   - Verifica se cartão existe
   - Debita saldo
   - Insere transação
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

**Endpoint:** `GET /itinerarios`

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

**Endpoint:** `POST /webhook/pix`

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
| 2 | Solicitar cartão | Emite novo cartão (Comum/Estudante/Idoso) |
| 3 | Listar cartões | Mostra todos os cartões e saldos |
| 4 | Recarregar via Pix | Verifica pendentes, gera código Pix ou paga pendentes |
| 5 | Bloquear cartão | Bloqueia cartão ativo |
| 6 | Solicitar segunda via | Emite novo cartão com saldo transferido |
| 7 | Simular catraca | Simula aproximação do cartão na catraca |
| 8 | Ver histórico | Mostra todas as transações |
| 9 | Consultar itinerários | Lista linhas de ônibus de Pelotas |
| 10 | Simular webhook | Simula confirmação de Pix |
| 11 | Excluir conta | Exclui conta conforme LGPD |

### Execução

```bash
npm run cli
```

### Configuração

O CLI usa a variável `VALIDADOR_ID` do `.env` para simular a catraca:

```env
VALIDADOR_ID=1203
```

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
- tipo (VARCHAR 20) - comum/admin
- status (VARCHAR 20)
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
- status (VARCHAR 20)
- created_at (TIMESTAMP)

**catracas:**
- id (VARCHAR 50) - ID da linha (ex: COHAB, FRAGATA, LARANJAL, AEROPORTO)
- nome (VARCHAR 100) - Nome da linha (ex: "Cohab / Tablada (Laranjal)")
- status (VARCHAR 20)
- historico (TEXT) - JSON com histórico de validações (cartões que tocou)

### Relacionamentos

- cartoes.usuario_id → usuarios.id (CASCADE)
- transacoes.cartao_id → cartoes.id (CASCADE)

---

## API Endpoints

### Autenticação
- `POST /usuarios/registrar` - Registrar usuário
- `POST /usuarios/login` - Login

### Usuários
- `GET /usuarios/perfil` - Ver perfil (auth)
- `DELETE /usuarios/conta` - Excluir conta (auth)

### Cartões
- `POST /cartoes` - Solicitar cartão (auth)
- `GET /cartoes` - Listar cartões (auth)
- `POST /cartoes/bloquear` - Bloquear cartão (auth)
- `POST /cartoes/segunda-via` - Solicitar segunda via (auth)
- `POST /cartoes/recarregar` - Recarregar via Pix (auth)
- `GET /cartoes/:id/transacoes` - Listar recargas do cartão (auth)
- `GET /cartoes/:id/historico` - Listar histórico de validações do cartão (auth)

### Transações
- `GET /transacoes/pendentes` - Listar recargas pendentes (auth)
- `POST /transacoes/:id/pagar` - Pagar recarga pendente (auth)

### Catracas
- `GET /api/catracas` - Listar todas as catracas (linhas)
- `GET /api/catracas/:id` - Obter catraca específica
- `GET /api/catracas/:id/validacoes` - Listar histórico de validações da catraca (apenas admin)
- `GET /api/catracas/tarifas` - Obter tarifas
- `POST /api/catraca/embarque` - Processar embarque
- `POST /api/catraca/sincronizar` - Sincronizar offline

### Itinerários
- `GET /itinerarios` - Consultar itinerários

### Webhooks
- `POST /webhook/pix` - Confirmar Pix
