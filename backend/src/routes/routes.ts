import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { AuthController } from '../controllers/AuthController';
import { ProfileController } from '../controllers/ProfileController';
import { CartaoController } from '../controllers/CartaoController';
import { WebhookController } from '../controllers/WebhookController';
import { CatracaController } from '../controllers/CatracaController';
import { ItinerarioController } from '../controllers/ItinerarioController';

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

export default router;
