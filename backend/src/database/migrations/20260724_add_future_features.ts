import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Alterar tabela usuarios para adicionar campos do clube de benefícios
  await knex.schema.alterTable('usuarios', (table) => {
    table.string('clube_status', 20).notNullable().defaultTo('inativo');
    table.timestamp('clube_expira_em').nullable();
  });

  // Alterar tabela transacoes para adicionar taxa de serviço
  await knex.schema.alterTable('transacoes', (table) => {
    table.decimal('taxa_servico', 8, 2).notNullable().defaultTo(0.00);
  });

  // Alterar tabela catracas para adicionar vinculo com a empresa frotista
  await knex.schema.alterTable('catracas', (table) => {
    table.string('empresa_id', 36).nullable().references('id').inTable('usuarios').onDelete('CASCADE');
  });

  // Nova tabela de Frotas (veículos)
  await knex.schema.createTable('frotas', (table) => {
    table.string('id', 36).primary();
    table.string('empresa_id', 36).notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
    table.string('placa', 10).notNullable().unique();
    table.string('modelo', 100).notNullable();
    table.integer('ano').notNullable();
    table.string('status', 20).notNullable().defaultTo('ativo'); // ativo/manutencao
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Nova tabela de Motoristas
  await knex.schema.createTable('motoristas', (table) => {
    table.string('id', 36).primary();
    table.string('empresa_id', 36).notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
    table.string('nome', 100).notNullable();
    table.string('cnh', 20).notNullable().unique();
    table.string('status', 20).notNullable().defaultTo('ativo'); // ativo/inativo
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Nova tabela de Excursões (Divulgação/Monetização)
  await knex.schema.createTable('excursoes', (table) => {
    table.string('id', 36).primary();
    table.string('empresa_id', 36).notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
    table.string('titulo', 100).notNullable();
    table.string('destino', 100).notNullable();
    table.decimal('preco', 8, 2).notNullable();
    table.decimal('patrocinio_valor', 8, 2).notNullable().defaultTo(0.00);
    table.string('status', 20).notNullable().defaultTo('ativo'); // ativo/cancelado/finalizado
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('excursoes');
  await knex.schema.dropTableIfExists('motoristas');
  await knex.schema.dropTableIfExists('frotas');

  await knex.schema.alterTable('catracas', (table) => {
    table.dropColumn('empresa_id');
  });

  await knex.schema.alterTable('transacoes', (table) => {
    table.dropColumn('taxa_servico');
  });

  await knex.schema.alterTable('usuarios', (table) => {
    table.dropColumn('clube_expira_em');
    table.dropColumn('clube_status');
  });
}
