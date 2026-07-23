import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Tabela de Usuários
  await knex.schema.createTable('usuarios', (table) => {
    table.string('id', 36).primary();
    table.string('nome', 100).notNullable();
    table.string('cpf', 11).notNullable().unique();
    table.string('email', 100).notNullable().unique();
    table.string('senha', 255).notNullable();
    table.string('tipo', 20).notNullable().defaultTo('comum'); // comum/admin
    table.string('status', 20).notNullable().defaultTo('ativo');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Tabela de Cartões
  await knex.schema.createTable('cartoes', (table) => {
    table.string('id', 36).primary();
    table.string('numero', 20).notNullable().unique();
    table.string('usuario_id', 36).notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
    table.string('tipo', 20).notNullable();
    table.decimal('saldo', 8, 2).notNullable().defaultTo(0.00);
    table.string('status', 20).notNullable().defaultTo('ativo');
    table.string('theme_url', 255).nullable();
    table.text('historico').defaultTo(null); // JSON com histórico de validações (catracas que passou)
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Tabela de Transações (apenas recargas)
  await knex.schema.createTable('transacoes', (table) => {
    table.string('id', 36).primary();
    table.string('cartao_id', 36).notNullable().references('id').inTable('cartoes').onDelete('CASCADE');
    table.string('tipo', 20).notNullable();
    table.decimal('valor', 8, 2).notNullable();
    table.string('status', 20).notNullable().defaultTo('confirmado');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Tabela de Catracas (com histórico em JSON)
  await knex.schema.createTable('catracas', (table) => {
    table.string('id', 50).primary();
    table.string('nome', 100).notNullable(); // Nome da linha
    table.string('status', 20).notNullable().defaultTo('ativo');
    table.text('historico'); // JSON com histórico de validações
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transacoes');
  await knex.schema.dropTableIfExists('cartoes');
  await knex.schema.dropTableIfExists('catracas');
  await knex.schema.dropTableIfExists('usuarios');
}
