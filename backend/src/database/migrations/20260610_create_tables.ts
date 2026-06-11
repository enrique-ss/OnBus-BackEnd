import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Tabela de Usuários
  await knex.schema.createTable('usuarios', (table) => {
    table.string('id', 36).primary();
    table.string('nome', 100).notNullable();
    table.string('cpf', 11).notNullable().unique();
    table.string('email', 100).notNullable().unique();
    table.string('senha', 255).notNullable();
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
    table.decimal('saldo', 10, 2).notNullable().defaultTo(0.00);
    table.string('status', 20).notNullable().defaultTo('ativo');
    table.string('layout_base_id', 50).notNullable();
    table.string('custom_theme_url', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Tabela de Transações
  await knex.schema.createTable('transacoes', (table) => {
    table.string('id', 36).primary();
    table.string('cartao_id', 36).notNullable().references('id').inTable('cartoes').onDelete('CASCADE');
    table.string('tipo', 20).notNullable();
    table.decimal('valor', 10, 2).notNullable();
    table.string('status', 20).notNullable().defaultTo('confirmado');
    table.string('local_validador_id', 50).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Tabela de Validadores
  await knex.schema.createTable('validadores', (table) => {
    table.string('id', 50).primary();
    table.string('status', 20).notNullable().defaultTo('ativo');
    table.timestamp('ultima_sincronizacao').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transacoes');
  await knex.schema.dropTableIfExists('cartoes');
  await knex.schema.dropTableIfExists('validadores');
  await knex.schema.dropTableIfExists('usuarios');
}
