/**
 * Conversas.routes.js — Rotas de conversas
 */

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/Conversas.controller');
const asyncHandler = require('../middlewares/asyncHandler');
const { exigirLogin } = require('../middlewares/Autenticacao');

router.use(exigirLogin);

router.get('/conversas', asyncHandler(ctrl.listar));
router.post('/conversas', asyncHandler(ctrl.criar));

router.get('/conversas/nova', asyncHandler(ctrl.formularioNovaIndividual));
router.get('/conversas/grupo', asyncHandler(ctrl.formularioNovoGrupo));

router.get('/conversas/:id', asyncHandler(ctrl.abrir));
router.get('/conversas/:id/buscar', asyncHandler(ctrl.buscarMensagens));
router.get('/conversas/:id/membros', asyncHandler(ctrl.membros));

router.post('/conversas/:id/participantes', asyncHandler(ctrl.adicionarParticipante));
router.post('/conversas/:id/participantes/remover', asyncHandler(ctrl.removerParticipante));

router.post('/conversas/:id/excluir', asyncHandler(ctrl.excluir));

module.exports = router;