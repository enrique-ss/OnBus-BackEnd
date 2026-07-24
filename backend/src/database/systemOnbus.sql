-- Sistema OnBus - Database (Atualizado com Recursos de Escalabilidade)

CREATE DATABASE IF NOT EXISTS onbus_local;
USE onbus_local;

CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY, -- UUID do usuário
  nome VARCHAR(100) NOT NULL, -- Nome completo
  cpf VARCHAR(11) NOT NULL UNIQUE, -- CPF/CNPJ (11 dígitos)
  email VARCHAR(100) NOT NULL UNIQUE, -- Email para login
  senha VARCHAR(255) NOT NULL, -- Senha hasheada
  tipo VARCHAR(20) NOT NULL DEFAULT 'comum', -- comum/admin/empresa
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- ativo/inativo
  clube_status VARCHAR(20) NOT NULL DEFAULT 'inativo', -- ativo/inativo
  clube_expira_em TIMESTAMP NULL DEFAULT NULL, -- Expiração da assinatura premium
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de cadastro
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Última atualização
);

CREATE TABLE IF NOT EXISTS cartoes (
  id VARCHAR(36) PRIMARY KEY, -- UUID do cartão
  numero VARCHAR(20) NOT NULL UNIQUE, -- Número físico do cartão
  usuario_id VARCHAR(36) NOT NULL, -- FK para usuarios
  tipo VARCHAR(20) NOT NULL, -- comum/estudante/idoso
  saldo DECIMAL(8, 2) NOT NULL DEFAULT 0.00, -- Saldo em reais
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- ativo/bloqueado/cancelado
  theme_url VARCHAR(255) DEFAULT NULL, -- URL do tema personalizado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de emissão
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Última alteração
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transacoes (
  id VARCHAR(36) PRIMARY KEY, -- UUID da transação
  cartao_id VARCHAR(36) NOT NULL, -- FK para cartoes
  tipo VARCHAR(20) NOT NULL, -- recarga
  valor DECIMAL(8, 2) NOT NULL, -- Valor da recarga
  taxa_servico DECIMAL(8, 2) NOT NULL DEFAULT 0.00, -- Comissão de conveniência do OnBus
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado', -- pendente/confirmado/falho
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da transação
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS catracas (
  id VARCHAR(50) PRIMARY KEY, -- ID da catraca
  nome VARCHAR(100) NOT NULL, -- Nome da linha (ex: "Cohab / Tablada (Laranjal)")
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- ativo/inativo
  empresa_id VARCHAR(36) DEFAULT NULL, -- FK para usuarios (vinculo B2B opcional)
  FOREIGN KEY (empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS frotas (
  id VARCHAR(36) PRIMARY KEY, -- UUID do veículo
  empresa_id VARCHAR(36) NOT NULL, -- FK para usuarios (dono do veículo)
  placa VARCHAR(10) NOT NULL UNIQUE, -- Placa do ônibus
  modelo VARCHAR(100) NOT NULL, -- Modelo do ônibus
  ano INT NOT NULL, -- Ano de fabricação
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- ativo/manutencao
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de cadastro
  FOREIGN KEY (empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS motoristas (
  id VARCHAR(36) PRIMARY KEY, -- UUID do motorista
  empresa_id VARCHAR(36) NOT NULL, -- FK para usuarios (empresa contratante)
  nome VARCHAR(100) NOT NULL, -- Nome completo
  cnh VARCHAR(20) NOT NULL UNIQUE, -- Número da CNH
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- ativo/inativo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de contratação
  FOREIGN KEY (empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS excursoes (
  id VARCHAR(36) PRIMARY KEY, -- UUID da excursão
  empresa_id VARCHAR(36) NOT NULL, -- FK para usuarios (empresa anunciante)
  titulo VARCHAR(100) NOT NULL, -- Título do anúncio
  destino VARCHAR(100) NOT NULL, -- Cidade de destino
  preco DECIMAL(8, 2) NOT NULL, -- Preço da passagem da excursão
  patrocinio_valor DECIMAL(8, 2) NOT NULL DEFAULT 0.00, -- Valor pago para destacar anúncio no topo
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- ativo/cancelado/finalizado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de publicação
  FOREIGN KEY (empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historicos (
  id VARCHAR(36) PRIMARY KEY, -- UUID da validação
  cartao_id VARCHAR(36) NOT NULL, -- FK para cartoes
  catraca_id VARCHAR(50) NOT NULL, -- FK para catracas
  cartao_numero VARCHAR(20) NOT NULL, -- Número do cartão (para consulta rápida)
  catraca_nome VARCHAR(100) NOT NULL, -- Nome da linha (para consulta rápida)
  tarifa DECIMAL(8, 2) NOT NULL, -- Tarifa cobrada
  autorizado VARCHAR(10) NOT NULL, -- sim/nao
  mensagem VARCHAR(255), -- Mensagem de status
  dia VARCHAR(20), -- Dia da semana (segunda, terca, etc)
  horario VARCHAR(5), -- Horário (HH:MM)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data/hora da validação
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE,
  FOREIGN KEY (catraca_id) REFERENCES catracas(id) ON DELETE CASCADE
);
