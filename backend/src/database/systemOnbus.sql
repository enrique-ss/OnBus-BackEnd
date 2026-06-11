-- Sistema OnBus - Database Schema
-- Criado em: 2026-06-10

CREATE DATABASE IF NOT EXISTS onbus_local;
USE onbus_local;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Cartões de Transporte
CREATE TABLE IF NOT EXISTS cartoes (
  id VARCHAR(36) PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  usuario_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- 'comum', 'estudante', 'idoso'
  saldo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- 'ativo', 'bloqueado', 'cancelado'
  layout_base_id VARCHAR(50) NOT NULL,
  custom_theme_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS transacoes (
  id VARCHAR(36) PRIMARY KEY,
  cartao_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- 'recarga', 'debito'
  valor DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado', -- 'pendente', 'confirmado', 'falho'
  local_validador_id VARCHAR(50) DEFAULT NULL, -- Prefixo do validador (ex: "1203")
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE
);

-- Tabela de Validadores
CREATE TABLE IF NOT EXISTS validadores (
  id VARCHAR(50) PRIMARY KEY, -- Ex: "1203"
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  ultima_sincronizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
