import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega variáveis de ambiente antes de qualquer import que as use
// O .env fica na raiz do projeto (mesmo nível do package.json)
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express from 'express';
import router from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Injeta as rotas da API
app.use(router);

// Rota raiz — verificação rápida de saúde da API
app.get('/', (req, res) => {
  res.json({
    app: 'OnBus API - Sistema Inteligente de Bilhetagem',
    status: 'online',
    banco: 'SQLite (backend/src/database/onbus.db)',
    versao: '1.0.0'
  });
});

// Middleware de erro genérico — último da cadeia
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`==============================================`);
  console.log(`🚌 Servidor OnBus rodando na porta ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🗄️  Banco: SQLite (backend/src/database/onbus.db)`);
  console.log(`==============================================`);
  console.log(`📋 CREDENCIAIS PADRÕES PARA TESTE:`);
  console.log(`   Passageiro: passageiro@teste.com / 123456`);
  console.log(`   Admin: admin@teste.com / 123456`);
  console.log(`   Empresa: empresa@teste.com / 123456`);
  console.log(`   Motorista: motorista@teste.com / 123456`);
  console.log(`==============================================`);
});
