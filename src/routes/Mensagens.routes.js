/**
 * Mensagens.routes.js — Rotas de mensagens
 */

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/Mensagens.controller');
const asyncHandler = require('../middlewares/asyncHandler');
const { exigirLogin } = require('../middlewares/Autenticacao');

router.use(exigirLogin);

router.post('/conversas/:id/mensagens', asyncHandler(ctrl.enviar));

router.post('/mensagens/:id/lida', asyncHandler(ctrl.marcarLida));
router.post('/mensagens/:id/excluir', asyncHandler(ctrl.excluir));

module.exports = router;