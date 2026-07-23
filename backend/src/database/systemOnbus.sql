-- Sistema OnBus - Database

CREATE DATABASE IF NOT EXISTS onbus_local;
USE onbus_local;

CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY, -- UUID do usuário
  nome VARCHAR(100) NOT NULL, -- Nome completo
  cpf VARCHAR(11) NOT NULL UNIQUE, -- CPF (11 dígitos)
  email VARCHAR(100) NOT NULL UNIQUE, -- Email para login
  senha VARCHAR(255) NOT NULL, -- Senha hasheada
  tipo VARCHAR(20) NOT NULL DEFAULT 'comum', -- comum/admin
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- ativo/inativo
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
  historico TEXT DEFAULT NULL, -- JSON com histórico de validações (catracas que passou)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de emissão
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Última alteração
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transacoes (
  id VARCHAR(36) PRIMARY KEY, -- UUID da transação
  cartao_id VARCHAR(36) NOT NULL, -- FK para cartoes
  tipo VARCHAR(20) NOT NULL, -- recarga
  valor DECIMAL(8, 2) NOT NULL, -- Valor da recarga
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado', -- pendente/confirmado/falho
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da transação
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS catracas (
  id VARCHAR(50) PRIMARY KEY, -- ID da catraca
  nome VARCHAR(100) NOT NULL, -- Nome da linha (ex: "Cohab / Tablada (Laranjal)")
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- ativo/inativo
  historico TEXT -- JSON com histórico de validações (cartões que tocou)
);
