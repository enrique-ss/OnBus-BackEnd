import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Nova tabela de Tarifas
  await knex.schema.createTable('tarifas', (table) => {
    table.string('id', 36).primary();
    table.string('tipo_cartao', 20).notNullable(); // comum, estudante, idoso
    table.decimal('valor', 8, 2).notNullable();
    table.string('descricao', 100).nullable();
    table.boolean('ativo').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Inserir tarifas padrão
  await knex('tarifas').insert([
    {
      id: 'tarifa-comum',
      tipo_cartao: 'comum',
      valor: 5.00,
      descricao: 'Tarifa padrão para passageiro comum',
      ativo: true
    },
    {
      id: 'tarifa-estudante',
      tipo_cartao: 'estudante',
      valor: 2.50,
      descricao: 'Meia tarifa para estudantes',
      ativo: true
    },
    {
      id: 'tarifa-idoso',
      tipo_cartao: 'idoso',
      valor: 0.00,
      descricao: 'Gratuidade para idosos',
      ativo: true
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tarifas');
}
