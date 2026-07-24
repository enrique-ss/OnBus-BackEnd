import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { empresaMiddleware } from '../middleware/empresaMiddleware';
import { passageiroMiddleware } from '../middleware/passageiroMiddleware';
import { motoristaMiddleware } from '../middleware/motoristaMiddleware';
import { AuthController } from '../controllers/AuthController';
import { ProfileController } from '../controllers/ProfileController';
import { CartaoController } from '../controllers/CartaoController';
import { WebhookController } from '../controllers/WebhookController';
import { CatracaController } from '../controllers/CatracaController';
import { ItinerarioController } from '../controllers/ItinerarioController';
import { ServicosController } from '../controllers/ServicosController';
import { LogsController } from '../controllers/LogsController';

const router = Router();

// ----------------------------------------------------
// ROTAS PÚBLICAS - AUTENTICAÇÃO
// ----------------------------------------------------

router.post('/api/auth/register', AuthController.register);
router.post('/api/auth/login', AuthController.login);

// ----------------------------------------------------
// ROTAS PRIVADAS - PERFIL (REQUER JWT)
// ----------------------------------------------------

router.get('/api/profile', authMiddleware, ProfileController.getProfile);
router.put('/api/profile', authMiddleware, ProfileController.updateProfile);
router.delete('/api/profile/lgpd', authMiddleware, ProfileController.deleteAccountLGPD);

// ----------------------------------------------------
// ROTAS PRIVADAS - CARTÕES & FINANCEIRO (REQUER JWT)
// Apenas passageiros podem gerenciar cartões
// ----------------------------------------------------

router.post('/api/cartoes', authMiddleware, passageiroMiddleware, CartaoController.emitir);
router.get('/api/cartoes', authMiddleware, passageiroMiddleware, CartaoController.listar);
router.post('/api/cartoes/:id/bloquear', authMiddleware, passageiroMiddleware, CartaoController.bloquear);
router.post('/api/cartoes/:id/segunda-via', authMiddleware, passageiroMiddleware, CartaoController.solicitarSegundaVia);
router.post('/api/cartoes/:id/recarregar', authMiddleware, passageiroMiddleware, CartaoController.recarregar);
router.get('/api/cartoes/:id/transacoes', authMiddleware, passageiroMiddleware, CartaoController.listarTransacoes);
router.get('/api/cartoes/:id/historico', authMiddleware, passageiroMiddleware, CartaoController.listarHistorico);
router.get('/api/transacoes/pendentes', authMiddleware, passageiroMiddleware, CartaoController.listarPendentes);
router.post('/api/transacoes/:id/pagar', authMiddleware, passageiroMiddleware, CartaoController.pagarPendente);

// Webhook do Gateway de Pagamento (Simulado)
router.post('/api/webhooks/pagamentos', WebhookController.pagamentos);

// ----------------------------------------------------
// ROTAS DE VALIDAÇÃO DE EMBARQUE & SINCRONIZAÇÃO
// ----------------------------------------------------

router.post('/api/catraca/embarque', CatracaController.processarEmbarqueOnline);
router.post('/api/catraca/sincronizar', CatracaController.sincronizarTransacoesOffline);
router.get('/api/catracas', CatracaController.listar);
router.get('/api/catracas/:id', CatracaController.obterCatraca);
router.get('/api/catracas/:id/validacoes', authMiddleware, adminMiddleware, CatracaController.listarValidacoes);
router.get('/api/catracas/tarifas', CatracaController.obterTarifas);

// Admin - Auditoria e monitoramento
router.get('/api/admin/transacoes', authMiddleware, adminMiddleware, CatracaController.listarTodasTransacoes);
router.get('/api/admin/logs', authMiddleware, adminMiddleware, LogsController.listarLogs);
router.get('/api/admin/logs/estatisticas', authMiddleware, adminMiddleware, LogsController.obterEstatisticas);

// Admin - Gestão de usuários
router.get('/api/admin/usuarios', authMiddleware, adminMiddleware, CatracaController.listarUsuarios);
router.put('/api/admin/usuarios/:id/status', authMiddleware, adminMiddleware, CatracaController.alterarStatusUsuario);
router.put('/api/admin/usuarios/:id/tipo', authMiddleware, adminMiddleware, CatracaController.alterarTipoUsuario);

// Admin - Gestão de tarifas
router.get('/api/admin/tarifas', authMiddleware, adminMiddleware, CatracaController.listarTarifas);
router.put('/api/admin/tarifas/:id', authMiddleware, adminMiddleware, CatracaController.atualizarTarifa);

// Admin - Aprovação de empresas
router.get('/api/admin/empresas/pendentes', authMiddleware, adminMiddleware, CatracaController.listarEmpresasPendentes);
router.put('/api/admin/empresas/:id/aprovar', authMiddleware, adminMiddleware, CatracaController.aprovarEmpresa);

// ----------------------------------------------------
// ROTAS DE ITINERÁRIOS
// ----------------------------------------------------

router.get('/api/itinerarios', ItinerarioController.listarHorarios);
router.get('/api/itinerarios/:id', ItinerarioController.getHorariosPorLinha);

// ----------------------------------------------------
// ROTAS DE SERVIÇOS ADICIONAIS (Clube, B2B, Excursões)
// ----------------------------------------------------

// Clube de Benefícios (Passageiro) - Apenas passageiros
router.post('/api/profile/clube', authMiddleware, passageiroMiddleware, ServicosController.subscribeClube);

// Gestão B2B (Frotas e Motoristas) - Apenas empresas
router.post('/api/empresa/frotas', authMiddleware, empresaMiddleware, ServicosController.cadastrarFrota);
router.get('/api/empresa/frotas', authMiddleware, empresaMiddleware, ServicosController.listarFrota);
router.post('/api/empresa/motoristas', authMiddleware, empresaMiddleware, ServicosController.cadastrarMotorista);
router.get('/api/empresa/motoristas', authMiddleware, empresaMiddleware, ServicosController.listarMotoristas);

// Excursões (Divulgação B2B/B2C) - Apenas empresas podem anunciar
router.post('/api/empresa/excursoes', authMiddleware, empresaMiddleware, ServicosController.cadastrarExcursao);
router.get('/api/excursoes', ServicosController.listarExcursoes);

// Motorista - Rotas específicas para motoristas (horários, tarefas)
router.get('/api/motorista/horarios', authMiddleware, motoristaMiddleware, ServicosController.listarHorariosMotorista);
router.get('/api/motorista/tarefas', authMiddleware, motoristaMiddleware, ServicosController.listarTarefasMotorista);

export default router;
