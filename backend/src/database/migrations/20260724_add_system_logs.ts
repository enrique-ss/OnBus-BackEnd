import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Nova tabela de Logs do Sistema (para auditoria)
  await knex.schema.createTable('logs', (table) => {
    table.string('id', 36).primary();
    table.string('nivel', 20).notNullable(); // info, warning, error, critical
    table.string('origem', 100).notNullable(); // auth, catraca, pagamento, etc
    table.string('mensagem', 500).notNullable();
    table.json('dados').nullable(); // Dados adicionais em JSON
    table.string('usuario_id', 36).nullable().references('id').inTable('usuarios').onDelete('SET NULL');
    table.string('ip', 50).nullable(); // IP da requisição
    table.string('metodo', 10).nullable(); // GET, POST, PUT, DELETE
    table.string('rota', 255).nullable(); // Rota acessada
    table.integer('status_code').nullable(); // HTTP status code
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Índice para busca por nível
  await knex.schema.alterTable('logs', (table) => {
    table.index('nivel');
  });

  // Índice para busca por origem
  await knex.schema.alterTable('logs', (table) => {
    table.index('origem');
  });

  // Índice para busca por data
  await knex.schema.alterTable('logs', (table) => {
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('logs');
}
