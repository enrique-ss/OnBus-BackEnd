import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('usuarios', (t) => t.integer('cashback_pontos').notNullable().defaultTo(0));
  await knex.schema.alterTable('catracas', (t) => {
    t.string('motorista_id', 36).nullable().references('id').inTable('usuarios').onDelete('SET NULL');
    t.string('onibus_id', 36).nullable().references('id').inTable('frotas').onDelete('SET NULL');
  });
  await knex.schema.alterTable('historicos', (t) => {
    t.string('motorista_id', 36).nullable().references('id').inTable('usuarios').onDelete('SET NULL');
    t.string('onibus_id', 36).nullable().references('id').inTable('frotas').onDelete('SET NULL');
  });
  await knex.schema.createTable('cashback_ledger', (t) => {
    t.string('id', 36).primary(); t.string('usuario_id', 36).notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
    t.string('transacao_id', 36).notNullable().unique().references('id').inTable('transacoes').onDelete('CASCADE');
    t.integer('pontos').notNullable(); t.timestamp('created_at').notNullable();
  });
  await knex.schema.createTable('avaliacoes_embarque', (t) => {
    t.string('id', 36).primary(); t.string('historico_id', 36).notNullable().unique().references('id').inTable('historicos').onDelete('CASCADE');
    t.string('usuario_id', 36).notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
    t.string('catraca_id', 50).notNullable().references('id').inTable('catracas').onDelete('CASCADE');
    t.string('motorista_id', 36).nullable().references('id').inTable('usuarios').onDelete('SET NULL');
    t.string('onibus_id', 36).nullable().references('id').inTable('frotas').onDelete('SET NULL');
    t.integer('nota_onibus').notNullable(); t.integer('nota_motorista').nullable(); t.string('comentario', 1000).nullable(); t.timestamp('created_at').notNullable();
  });
  await knex.schema.createTable('aceites_termos', (t) => {
    t.string('id', 36).primary(); t.string('usuario_id', 36).notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
    t.string('versao', 30).notNullable(); t.string('ip', 50).nullable(); t.timestamp('aceito_em').notNullable(); t.unique(['usuario_id', 'versao']);
  });
  await knex.schema.createTable('viagens_intermunicipais', (t) => {
    t.string('id', 36).primary(); t.string('origem', 100).notNullable(); t.string('destino', 100).notNullable();
    t.timestamp('partida_em').notNullable(); t.timestamp('chegada_em').nullable(); t.string('operadora', 120).notNullable();
    t.integer('assentos').notNullable(); t.decimal('preco', 10, 2).notNullable(); t.boolean('ativa').notNullable().defaultTo(true); t.timestamp('created_at').notNullable();
  });
  await knex.schema.createTable('passagens', (t) => {
    t.string('id', 36).primary(); t.string('viagem_id', 36).notNullable().references('id').inTable('viagens_intermunicipais').onDelete('CASCADE');
    t.string('usuario_id', 36).notNullable().references('id').inTable('usuarios').onDelete('CASCADE'); t.integer('assento').notNullable();
    t.string('status', 20).notNullable(); t.decimal('valor', 10, 2).notNullable(); t.string('gateway_pagamento_id', 255).nullable();
    t.timestamp('expira_em').notNullable(); t.timestamp('created_at').notNullable(); t.timestamp('paga_em').nullable();
    t.index(['viagem_id', 'status', 'expira_em']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('passagens'); await knex.schema.dropTableIfExists('viagens_intermunicipais');
  await knex.schema.dropTableIfExists('aceites_termos'); await knex.schema.dropTableIfExists('avaliacoes_embarque'); await knex.schema.dropTableIfExists('cashback_ledger');
  await knex.schema.alterTable('historicos', (t) => { t.dropColumn('onibus_id'); t.dropColumn('motorista_id'); });
  await knex.schema.alterTable('catracas', (t) => { t.dropColumn('onibus_id'); t.dropColumn('motorista_id'); });
  await knex.schema.alterTable('usuarios', (t) => t.dropColumn('cashback_pontos'));
}
