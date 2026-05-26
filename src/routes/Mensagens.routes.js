/**
 * Mensagens.routes.js — Rotas de mensagens
 */

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/Mensagens.controller');
const { exigirLogin } = require('../middlewares/Autenticacao');

router.use(exigirLogin);

router.post('/conversas/:id/mensagens', ctrl.enviar);

router.post('/mensagens/:id/lida', ctrl.marcarLida);
router.post('/mensagens/:id/excluir', ctrl.excluir);

module.exports = router;