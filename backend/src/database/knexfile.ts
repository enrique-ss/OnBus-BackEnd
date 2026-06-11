import type { Knex } from 'knex';
import * as path from 'path';

/**
 * Configuração do Knex para os diferentes ambientes.
 *
 * LOCAL (desenvolvimento): SQLite — banco de dados embutido, sem servidor.
 *   Arquivo gerado em: backend/src/database/onbus.db
 *
 * PRODUCTION (nuvem): PostgreSQL via Supabase.
 *   Para migrar, basta trocar `client` e `connection` abaixo.
 *   Todas as migrations, seeds e services permanecem idênticos.
 */
const config: { [key: string]: Knex.Config } = {
  // ── Desenvolvimento local ───────────────────────────────────────────────
  development: {
    client: 'better-sqlite3',
    connection: {
      // Caminho absoluto para o arquivo .db gerado em backend/src/database/
      filename: path.join(__dirname, 'onbus.db')
    },
    // SQLite não suporta DEFAULT para colunas opcionais — obrigatório
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
      extension: 'ts',
    },
  },

  // ── Produção (Supabase / PostgreSQL) ────────────────────────────────────
  // Para ativar: definir NODE_ENV=production e DATABASE_URL no .env
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
      extension: 'ts',
    },
  },
};

export default config;
export { config };
