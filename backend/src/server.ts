import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega variáveis de ambiente antes de qualquer import que as use
// O .env fica na raiz do projeto (mesmo nível do package.json)
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express from 'express';
import router from './routes';
import { RecargaProgramadaService } from './services/RecargaProgramadaService';
import { db } from './database/connection';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Injeta as rotas da API
app.use(router);

app.get('/reset-password', (req, res) => {
  const token = typeof req.query.token === 'string' && /^[a-f0-9]{64}$/.test(req.query.token) ? req.query.token : '';
  if (!token) return res.status(400).send('Link de recuperação inválido ou expirado.');
  res.type('html').send(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Redefinir senha OnBus</title><main style="font:16px system-ui;max-width:420px;margin:10vh auto;padding:24px"><h1>Redefinir senha</h1><form id="f"><label>Nova senha (mínimo 8 caracteres)<br><input name="senha" type="password" minlength="8" required></label><p><button>Salvar senha</button></p></form><p id="m"></p></main><script>document.getElementById('f').onsubmit=async e=>{e.preventDefault();const senha=new FormData(e.target).get('senha');const r=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:${JSON.stringify(token)},senha})});document.getElementById('m').textContent=r.ok?'Senha redefinida. Você já pode entrar no OnBus.':(await r.json()).error}</script></html>`);
});

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

// Run pending migrations before accepting traffic so API and schema stay in sync.
db.knex.migrate.latest().then(() => app.listen(PORT, () => {
  setInterval(() => RecargaProgramadaService.processarVencidas().catch((error) => console.error('Erro no processador de recargas programadas:', error)), 60_000).unref();
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
})).catch((error) => {
  console.error('Falha ao migrar/conectar ao banco de dados:', error);
  process.exit(1);
});
