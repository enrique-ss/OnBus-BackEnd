-- Sistema OnBus - Database

CREATE DATABASE IF NOT EXISTS onbus_local; -- Cria o banco de dados se não existir
USE onbus_local; -- Seleciona o banco de dados para uso

-- Tabela de Usuários (Passageiros do sistema)
-- PROPÓSITO: Armazenar dados cadastrais dos passageiros que utilizam o sistema de transporte
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY, -- ID único do usuário
  nome VARCHAR(100) NOT NULL, -- Nome completo do passageiro
  cpf VARCHAR(11) NOT NULL UNIQUE, -- CPF (11 dígitos numéricos, sem formatação), único por usuário
  email VARCHAR(100) NOT NULL UNIQUE, -- Email para login e contato, único por usuário
  senha VARCHAR(255) NOT NULL, -- Senha do usuário
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- Status da conta ('ativo' = pode usar, 'inativo' = conta desativada/bloqueada)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data/hora de cadastro no sistema
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Data/hora da última alteração nos dados
);

-- Tabela de Cartões de Transporte
-- PROPÓSITO: Representar os cartões físicos (NFC/RFID) utilizados pelos passageiros
-- O tipo define a tarifa aplicada: comum=R$5,00, estudante=R$2,50, idoso=gratuito
CREATE TABLE IF NOT EXISTS cartoes (
  id VARCHAR(36) PRIMARY KEY, -- ID único do cartão
  numero VARCHAR(20) NOT NULL UNIQUE, -- Número físico impresso no cartão (ex: "1234567890123456")
  usuario_id VARCHAR(36) NOT NULL, -- FK para o usuário proprietário do cartão
  tipo VARCHAR(20) NOT NULL, -- Categoria de tarifa ('comum', 'estudante', 'idoso')
  saldo DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Saldo disponível em reais (máximo 99.999.999,99)
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- Status do cartão ('ativo' = em uso, 'bloqueado' = protegido, 'cancelado' = inutilizado)
  layout_base_id VARCHAR(50) NOT NULL, -- ID do template visual do cartão (design padrão)
  custom_theme_url VARCHAR(255) DEFAULT NULL, -- URL opcional para imagem personalizada do usuário
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data/hora de emissão do cartão
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Data/hora da última alteração (saldo, status, etc)
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE -- Se usuário for excluído (LGPD), remove seus cartões
);

-- Tabela de Transações (Histórico financeiro e de uso)
-- PROPÓSITO: Registrar TODOS os movimentos de saldo nos cartões
-- Tipos: 'recarga' = entrada de dinheiro (Pix), 'debito' = passagem na catraca
-- O status permite rastrear pagamentos pendentes/confirmados/falhos
-- local_validador_id vincula a transação ao ônibus/catraca específica
CREATE TABLE IF NOT EXISTS transacoes (
  id VARCHAR(36) PRIMARY KEY, -- ID único da transação (formato UUID v4)
  cartao_id VARCHAR(36) NOT NULL, -- FK para o cartão que sofreu a transação
  tipo VARCHAR(20) NOT NULL, -- Tipo de movimento ('recarga' = crédito, 'debito' = passagem)
  valor DECIMAL(10, 2) NOT NULL, -- Valor absoluto da transação (sempre positivo)
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado', -- Status ('pendente' = aguardando Pix, 'confirmado' = processado, 'falho' = erro)
  local_validador_id VARCHAR(50) DEFAULT NULL, -- FK para validadores (qual catraca processou o débito)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data/hora exata da transação
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE -- Se cartão for cancelado, mantém histórico
);

-- Tabela de Validadores (Catracas/Equipamentos físicos nos ônibus)
-- PROPÓSITO: Registrar cada equipamento de validação instalado nos veículos da frota
-- Cada validador representa uma catraca física onde os passageiros aproximam o cartão para embarque
-- O ID identifica qual ônibus/catraca processou a transação (rastreabilidade geográfica)
-- UTILIZAÇÃO: O backend valida se o validador existe e está ativo antes de processar transações
-- Atualiza ultima_sincronizacao automaticamente quando o validador sincroniza transações offline
CREATE TABLE IF NOT EXISTS validadores (
  id VARCHAR(50) PRIMARY KEY, -- ID único do validador/catraca (ex: "1203" = ônibus linha 12, catraca 03)
  status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- Status do validador ('ativo' = operando, 'inativo' = manutenção/desativado)
  ultima_sincronizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data/hora da última conexão deste validador com o servidor central
);
