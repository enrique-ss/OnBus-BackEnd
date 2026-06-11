import knex, { Knex } from 'knex';
import config from './knexfile';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces dos Modelos de Domínio
// ─────────────────────────────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Cartao {
  id: string;
  numero: string;
  usuario_id: string;
  tipo: 'comum' | 'estudante' | 'idoso';
  saldo: number;
  status: 'ativo' | 'bloqueado' | 'cancelado';
  layout_base_id: string;
  custom_theme_url: string;
  created_at: string;
  updated_at: string;
}

export interface Transacao {
  id: string;
  cartao_id: string;
  tipo: 'recarga' | 'debito';
  valor: number;
  status: 'pendente' | 'confirmado' | 'falho';
  local_validador_id: string | null;
  created_at: string;
}

export interface Validador {
  id: string;
  status: string;
  ultima_sincronizacao: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interface genérica de acesso a tabelas
// Todos os services usam essa abstração — não dependem de Knex diretamente.
// ─────────────────────────────────────────────────────────────────────────────

export interface TableWrapper<T> {
  insert(data: T): Promise<T>;
  findOne(query: Partial<T>): Promise<T | null>;
  find(query: Partial<T>): Promise<T[]>;
  update(query: Partial<T>, data: Partial<T>): Promise<number>;
  delete(query: Partial<T>): Promise<number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Implementação: KnexTableWrapper
// Traduz as operações da TableWrapper em queries SQL via Knex.
// Funciona para qualquer banco suportado pelo Knex (SQLite, PostgreSQL, etc.)
// ─────────────────────────────────────────────────────────────────────────────

class KnexTableWrapper<T> implements TableWrapper<T> {
  constructor(
    private knexInstance: Knex,
    private tableName: string
  ) {}

  async insert(data: T): Promise<T> {
    await this.knexInstance(this.tableName).insert(data);
    return data;
  }

  async findOne(query: Partial<T>): Promise<T | null> {
    const row = await this.knexInstance(this.tableName).where(query as any).first();
    return row || null;
  }

  async find(query: Partial<T>): Promise<T[]> {
    return await this.knexInstance(this.tableName).where(query as any);
  }

  async update(query: Partial<T>, data: Partial<T>): Promise<number> {
    return await this.knexInstance(this.tableName).where(query as any).update(data as any);
  }

  async delete(query: Partial<T>): Promise<number> {
    return await this.knexInstance(this.tableName).where(query as any).del();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Conexão principal — instância Knex com SQLite
//
// Em produção (Supabase), apenas o knexfile.ts muda.
// Este arquivo e todos os services permanecem idênticos.
// ─────────────────────────────────────────────────────────────────────────────

const environment = process.env.NODE_ENV || 'development';
const knexInstance = knex(config[environment] ?? config.development);

// Objeto `db` exportado para uso em todos os services
export const db = {
  knex: knexInstance,
  usuarios: new KnexTableWrapper<Usuario>(knexInstance, 'usuarios'),
  cartoes: new KnexTableWrapper<Cartao>(knexInstance, 'cartoes'),
  transacoes: new KnexTableWrapper<Transacao>(knexInstance, 'transacoes'),
  validadores: new KnexTableWrapper<Validador>(knexInstance, 'validadores'),
};
