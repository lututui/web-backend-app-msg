/**
 * Conversas.routes.js — Rotas de conversas
 */

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/Conversas.controller');
const { exigirLogin } = require('../middlewares/Autenticacao');

router.use(exigirLogin);

router.get('/conversas', ctrl.listar);
router.get('/conversas/nova', ctrl.formularioNova);
router.post('/conversas', ctrl.criar);

router.get('/conversas/:id', ctrl.abrir);
router.get('/conversas/:id/buscar', ctrl.buscarMensagens);

router.post('/conversas/:id/participantes', ctrl.adicionarParticipante);
router.post('/conversas/:id/participantes/remover', ctrl.removerParticipante);
router.post('/conversas/:id/excluir', ctrl.excluir);

module.exports = router;