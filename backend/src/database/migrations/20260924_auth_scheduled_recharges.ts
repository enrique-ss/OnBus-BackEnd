import { Knex } from 'knex';
import * as fs from 'fs';
import * as path from 'path';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('itinerarios', (table) => {
    table.string('id', 50).primary();
    table.string('nome', 100).notNullable();
    table.json('dias_uteis').notNullable();
    table.json('sabados').notNullable();
    table.json('domingos').notNullable();
    table.timestamp('updated_at').notNullable();
  });
  const schedulePath = path.join(__dirname, '..', 'horarios.json');
  if (fs.existsSync(schedulePath)) {
    const lines = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    if (lines.length) {
      await knex('itinerarios').insert(lines.map((line: any) => ({
        id: line.id,
        nome: line.nome,
        dias_uteis: JSON.stringify(line.dias_uteis),
        sabados: JSON.stringify(line.sabados),
        domingos: JSON.stringify(line.domingos),
        updated_at: new Date().toISOString()
      })));
    }
  }
  await knex.schema.alterTable('usuarios', (table) => {
    table.boolean('two_factor_enabled').notNullable().defaultTo(false);
  });
  await knex.schema.createTable('auth_tokens', (table) => {
    table.string('id', 36).primary();
    table.string('usuario_id', 36).notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
    table.string('tipo', 20).notNullable();
    table.string('token_hash', 64).notNullable();
    table.timestamp('expira_em').notNullable();
    table.timestamp('usado_em').nullable();
    table.timestamp('created_at').notNullable();
    table.index(['usuario_id', 'tipo']);
  });
  await knex.schema.createTable('recargas_programadas', (table) => {
    table.string('id', 36).primary();
    table.string('cartao_id', 36).notNullable().references('id').inTable('cartoes').onDelete('CASCADE');
    table.decimal('valor', 8, 2).notNullable();
    table.decimal('saldo_minimo', 8, 2).notNullable();
    table.boolean('ativa').notNullable().defaultTo(true);
    table.timestamp('proxima_execucao').nullable();
    table.string('payment_method_id', 255).notNullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
    table.index(['ativa', 'proxima_execucao']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('itinerarios');
  await knex.schema.dropTableIfExists('recargas_programadas');
  await knex.schema.dropTableIfExists('auth_tokens');
  await knex.schema.alterTable('usuarios', (table) => table.dropColumn('two_factor_enabled'));
}
