-- Sistema OnBus - Database Completo

CREATE DATABASE IF NOT EXISTS onbus_local;
USE onbus_local;

-- Usuarios e autenticacao
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'comum',
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  clube_status VARCHAR(20) NOT NULL DEFAULT 'inativo',
  clube_expira_em TIMESTAMP NULL DEFAULT NULL,
  cnh VARCHAR(20) NULL DEFAULT NULL UNIQUE,
  empresa_id VARCHAR(36) NULL DEFAULT NULL,
  aprovacao_status VARCHAR(20) NOT NULL DEFAULT 'aprovado',
  dois_fatores_ativo TINYINT(1) NOT NULL DEFAULT 0,
  dois_fatores_secret VARCHAR(255) NULL DEFAULT NULL,
  acessibilidade_prefs JSON NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dispositivos_login (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  dispositivo VARCHAR(150) NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  sucesso TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS termos_aceites (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  versao_termo VARCHAR(20) NOT NULL,
  aceito_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS permissoes (
  id VARCHAR(36) PRIMARY KEY,
  chave VARCHAR(60) NOT NULL UNIQUE,
  descricao VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario_permissoes (
  usuario_id VARCHAR(36) NOT NULL,
  permissao_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (usuario_id, permissao_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dependentes (
  id VARCHAR(36) PRIMARY KEY,
  titular_id VARCHAR(36) NOT NULL,
  dependente_id VARCHAR(36) NOT NULL,
  relacao VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (titular_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (dependente_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Cartoes e financeiro
CREATE TABLE IF NOT EXISTS cartoes (
  id VARCHAR(36) PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  usuario_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  saldo DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  theme_url VARCHAR(255) DEFAULT NULL,
  apelido VARCHAR(60) NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cartoes_historico (
  id VARCHAR(36) PRIMARY KEY,
  cartao_id VARCHAR(36) NOT NULL,
  evento VARCHAR(30) NOT NULL,
  motivo VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metodos_pagamento (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  token_gateway VARCHAR(255) NOT NULL,
  apelido VARCHAR(60) NULL,
  principal TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recargas_programadas (
  id VARCHAR(36) PRIMARY KEY,
  cartao_id VARCHAR(36) NOT NULL,
  metodo_pagamento_id VARCHAR(36) NULL,
  valor DECIMAL(8, 2) NOT NULL,
  gatilho VARCHAR(20) NOT NULL DEFAULT 'saldo_minimo',
  saldo_minimo DECIMAL(8, 2) NULL,
  frequencia VARCHAR(20) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE,
  FOREIGN KEY (metodo_pagamento_id) REFERENCES metodos_pagamento(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transacoes (
  id VARCHAR(36) PRIMARY KEY,
  cartao_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  valor DECIMAL(8, 2) NOT NULL,
  taxa_servico DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado',
  metodo_pagamento_id VARCHAR(36) NULL,
  comprovante_url VARCHAR(255) NULL,
  recarga_programada_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE,
  FOREIGN KEY (metodo_pagamento_id) REFERENCES metodos_pagamento(id) ON DELETE SET NULL,
  FOREIGN KEY (recarga_programada_id) REFERENCES recargas_programadas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS clube_pagamentos (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  valor DECIMAL(8, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado',
  periodo_inicio TIMESTAMP NOT NULL,
  periodo_fim TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tarifas (
  id VARCHAR(36) PRIMARY KEY,
  tipo_cartao VARCHAR(20) NOT NULL,
  valor DECIMAL(8, 2) NOT NULL,
  descricao VARCHAR(100) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Linhas, frota e catracas
CREATE TABLE IF NOT EXISTS linhas (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NULL,
  nome VARCHAR(100) NOT NULL,
  origem VARCHAR(100) NOT NULL,
  destino VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS horarios_linha (
  id VARCHAR(36) PRIMARY KEY,
  linha_id VARCHAR(36) NOT NULL,
  dia_semana VARCHAR(15) NOT NULL,
  horario_partida VARCHAR(5) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (linha_id) REFERENCES linhas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS catracas (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  empresa_id VARCHAR(36) DEFAULT NULL,
  linha_id VARCHAR(36) NULL DEFAULT NULL,
  veiculo_id VARCHAR(36) NULL DEFAULT NULL,
  ultimo_status_em TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (linha_id) REFERENCES linhas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS frotas (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  placa VARCHAR(10) NOT NULL UNIQUE,
  modelo VARCHAR(100) NOT NULL,
  ano INT NOT NULL,
  capacidade INT NULL DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

ALTER TABLE catracas
  ADD CONSTRAINT fk_catracas_veiculo FOREIGN KEY (veiculo_id) REFERENCES frotas(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS alocacoes (
  id VARCHAR(36) PRIMARY KEY,
  motorista_id VARCHAR(36) NOT NULL,
  veiculo_id VARCHAR(36) NOT NULL,
  linha_id VARCHAR(36) NOT NULL,
  turno VARCHAR(20) NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (motorista_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (veiculo_id) REFERENCES frotas(id) ON DELETE CASCADE,
  FOREIGN KEY (linha_id) REFERENCES linhas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jornadas_trabalho (
  id VARCHAR(36) PRIMARY KEY,
  motorista_id VARCHAR(36) NOT NULL,
  alocacao_id VARCHAR(36) NULL,
  inicio TIMESTAMP NOT NULL,
  fim TIMESTAMP NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'em_andamento',
  FOREIGN KEY (motorista_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (alocacao_id) REFERENCES alocacoes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS incidentes (
  id VARCHAR(36) PRIMARY KEY,
  motorista_id VARCHAR(36) NOT NULL,
  veiculo_id VARCHAR(36) NULL,
  tipo VARCHAR(30) NOT NULL,
  descricao TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (motorista_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (veiculo_id) REFERENCES frotas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS veiculos_localizacao (
  veiculo_id VARCHAR(36) PRIMARY KEY,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  velocidade_kmh DECIMAL(5,2) NULL,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES frotas(id) ON DELETE CASCADE
);

-- Viagens, passagens e excursoes
CREATE TABLE IF NOT EXISTS viagens (
  id VARCHAR(36) PRIMARY KEY,
  linha_id VARCHAR(36) NOT NULL,
  veiculo_id VARCHAR(36) NULL,
  motorista_id VARCHAR(36) NULL,
  partida_prevista TIMESTAMP NOT NULL,
  chegada_prevista TIMESTAMP NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'agendada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (linha_id) REFERENCES linhas(id) ON DELETE CASCADE,
  FOREIGN KEY (veiculo_id) REFERENCES frotas(id) ON DELETE SET NULL,
  FOREIGN KEY (motorista_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS excursoes (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  destino VARCHAR(100) NOT NULL,
  preco DECIMAL(8, 2) NOT NULL,
  vagas_totais INT NULL DEFAULT NULL,
  vagas_ocupadas INT NOT NULL DEFAULT 0,
  patrocinio_valor DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS passagens (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  viagem_id VARCHAR(36) NULL,
  excursao_id VARCHAR(36) NULL,
  metodo_pagamento_id VARCHAR(36) NULL,
  preco DECIMAL(8, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'reservada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE CASCADE,
  FOREIGN KEY (excursao_id) REFERENCES excursoes(id) ON DELETE CASCADE,
  FOREIGN KEY (metodo_pagamento_id) REFERENCES metodos_pagamento(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS favoritos (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  linha_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (linha_id) REFERENCES linhas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historicos (
  id VARCHAR(36) PRIMARY KEY,
  cartao_id VARCHAR(36) NOT NULL,
  catraca_id VARCHAR(50) NOT NULL,
  viagem_id VARCHAR(36) NULL,
  cartao_numero VARCHAR(20) NOT NULL,
  catraca_nome VARCHAR(100) NOT NULL,
  tarifa DECIMAL(8, 2) NOT NULL,
  autorizado VARCHAR(10) NOT NULL,
  mensagem VARCHAR(255),
  dia VARCHAR(20),
  horario VARCHAR(5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE,
  FOREIGN KEY (catraca_id) REFERENCES catracas(id) ON DELETE CASCADE,
  FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE SET NULL
);

-- Avaliacoes e suporte
CREATE TABLE IF NOT EXISTS avaliacoes (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  alvo_id VARCHAR(36) NOT NULL,
  nota TINYINT NOT NULL,
  comentario TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reclamacoes (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  alvo_id VARCHAR(36) NULL,
  descricao TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberta',
  resposta TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tickets_suporte (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  atendente_id VARCHAR(36) NULL,
  assunto VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto',
  resposta TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (atendente_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Fidelidade e indicacoes
CREATE TABLE IF NOT EXISTS fidelidade_pontos (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  pontos INT NOT NULL,
  origem VARCHAR(30) NOT NULL,
  referencia_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS indicacoes (
  id VARCHAR(36) PRIMARY KEY,
  usuario_indicador_id VARCHAR(36) NOT NULL,
  usuario_indicado_id VARCHAR(36) NULL,
  email_convidado VARCHAR(100) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_indicador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_indicado_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Sistema: notificacoes, auditoria, fraude, sincronizacao offline
CREATE TABLE IF NOT EXISTS notificacoes (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  lida TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs_sistema (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NULL,
  nivel VARCHAR(20) NOT NULL,
  origem VARCHAR(100) NOT NULL,
  mensagem VARCHAR(500) NOT NULL,
  dados JSON NULL,
  ip VARCHAR(45) NULL,
  metodo VARCHAR(10) NULL,
  rota VARCHAR(255) NULL,
  status_code INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fraude_alertas (
  id VARCHAR(36) PRIMARY KEY,
  cartao_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  descricao TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fila_sincronizacao_offline (
  id VARCHAR(36) PRIMARY KEY,
  origem VARCHAR(50) NOT NULL,
  tipo_evento VARCHAR(30) NOT NULL,
  payload JSON NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  tentativas INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sincronizado_em TIMESTAMP NULL DEFAULT NULL
);

-- Mensagens motorista-empresa
CREATE TABLE IF NOT EXISTS mensagens (
  id VARCHAR(36) PRIMARY KEY,
  remetente_id VARCHAR(36) NOT NULL,
  destinatario_id VARCHAR(36) NOT NULL,
  assunto VARCHAR(150) NULL,
  conteudo TEXT NOT NULL,
  lida TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- QR codes para embarque
CREATE TABLE IF NOT EXISTS qr_codes (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  cartao_id VARCHAR(36) NULL,
  passagem_id VARCHAR(36) NULL,
  codigo VARCHAR(255) NOT NULL UNIQUE,
  valido_de TIMESTAMP NOT NULL,
  valido_ate TIMESTAMP NOT NULL,
  utilizado TINYINT(1) NOT NULL DEFAULT 0,
  utilizado_em TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE SET NULL,
  FOREIGN KEY (passagem_id) REFERENCES passagens(id) ON DELETE SET NULL
);

-- Indices
CREATE INDEX idx_transacoes_cartao ON transacoes(cartao_id, created_at);
CREATE INDEX idx_historicos_cartao ON historicos(cartao_id, created_at);
CREATE INDEX idx_passagens_usuario ON passagens(usuario_id, status);
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id, lida);
CREATE INDEX idx_viagens_linha ON viagens(linha_id, partida_prevista);
CREATE INDEX idx_alocacoes_motorista ON alocacoes(motorista_id, status);
CREATE INDEX idx_dependentes_titular ON dependentes(titular_id);
CREATE INDEX idx_mensagens_destinatario ON mensagens(destinatario_id, lida);
CREATE INDEX idx_logs_sistema_nivel ON logs_sistema(nivel);
CREATE INDEX idx_logs_sistema_origem ON logs_sistema(origem);
CREATE INDEX idx_logs_sistema_created_at ON logs_sistema(created_at);
