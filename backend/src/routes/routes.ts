import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { AuthController } from '../controllers/AuthController';
import { ProfileController } from '../controllers/ProfileController';
import { CartaoController } from '../controllers/CartaoController';
import { WebhookController } from '../controllers/WebhookController';
import { CatracaController } from '../controllers/CatracaController';
import { ItinerarioController } from '../controllers/ItinerarioController';
import { FuturoController } from '../controllers/FuturoController';

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
// ----------------------------------------------------

router.post('/api/cartoes', authMiddleware, CartaoController.emitir);
router.get('/api/cartoes', authMiddleware, CartaoController.listar);
router.post('/api/cartoes/:id/bloquear', authMiddleware, CartaoController.bloquear);
router.post('/api/cartoes/:id/segunda-via', authMiddleware, CartaoController.solicitarSegundaVia);
router.post('/api/cartoes/:id/recarregar', authMiddleware, CartaoController.recarregar);
router.get('/api/cartoes/:id/transacoes', authMiddleware, CartaoController.listarTransacoes);
router.get('/api/cartoes/:id/historico', authMiddleware, CartaoController.listarHistorico);
router.get('/api/transacoes/pendentes', authMiddleware, CartaoController.listarPendentes);
router.post('/api/transacoes/:id/pagar', authMiddleware, CartaoController.pagarPendente);

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

// ----------------------------------------------------
// ROTAS DE ITINERÁRIOS
// ----------------------------------------------------

router.get('/api/itinerarios', ItinerarioController.listarHorarios);
router.get('/api/itinerarios/:id', ItinerarioController.getHorariosPorLinha);

// ----------------------------------------------------
// ROTAS DE FUNCIONALIDADES FUTURAS (ESCALABILIDADE)
// ----------------------------------------------------

// Clube de Benefícios (Passageiro)
router.post('/api/profile/clube', authMiddleware, FuturoController.subscribeClube);

// Gestão B2B (Frotas e Motoristas)
router.post('/api/empresa/frotas', authMiddleware, FuturoController.cadastrarFrota);
router.get('/api/empresa/frotas', authMiddleware, FuturoController.listarFrota);
router.post('/api/empresa/motoristas', authMiddleware, FuturoController.cadastrarMotorista);
router.get('/api/empresa/motoristas', authMiddleware, FuturoController.listarMotoristas);

// Excursões (Divulgação B2B/B2C)
router.post('/api/empresa/excursoes', authMiddleware, FuturoController.cadastrarExcursao);
router.get('/api/excursoes', FuturoController.listarExcursoes);

export default router;
