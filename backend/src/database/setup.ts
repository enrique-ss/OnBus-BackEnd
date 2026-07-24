import knex from 'knex';
import config from './knexfile';

/**
 * Script de setup do banco de dados.
 *
 * O que faz:
 *   1. Conecta ao SQLite (cria o arquivo backend/src/database/onbus.db se não existir)
 *   2. Reverte todas as migrations existentes (rollback)
 *   3. Executa as migrations do zero (cria as tabelas)
 *   4. Popula com os dados iniciais (seeds)
 *
 * Uso: npm run setup
 * Atenção: apaga todos os dados existentes no banco.
 */
async function setup() {
  const environment = process.env.NODE_ENV || 'development';
  const kInstance = knex(config[environment] ?? config.development);

  try {
    console.log('🗄️  Iniciando setup do banco de dados SQLite...');
    console.log('   Arquivo: backend/src/database/onbus.db');

    console.log('\n⬇️  Revertendo migrations anteriores (rollback)...');
    await kInstance.migrate.rollback(undefined, true);

    console.log('⬆️  Executando migrations (criando tabelas)...');
    await kInstance.migrate.latest();

    console.log('🌱 Executando seeds (dados iniciais)...');
    await kInstance.seed.run();

    console.log('\n✅ Banco de dados configurado com sucesso!');
    console.log('   Tabelas: usuarios, cartoes, transacoes, catracas, frotas, motoristas, excursoes');
    console.log('   Seeds: dados iniciais e de simulação futura inseridos\n');
  } catch (err: any) {
    console.error('\n❌ Erro durante o setup:', err.message);
    process.exit(1);
  } finally {
    await kInstance.destroy();
  }
}

setup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Falha fatal no setup:', err);
    process.exit(1);
  });
