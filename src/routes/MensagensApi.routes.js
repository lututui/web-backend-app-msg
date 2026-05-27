/**
 * MensagensApi.routes.js — Rota da API JSON de mensagens
 */

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/MensagensApi.controller');
const asyncHandler = require('../middlewares/AsyncHandler');
const { exigirLogin } = require('../middlewares/Autenticacao');

router.use(exigirLogin);

router.get(
    '/api/conversas/:id/mensagens',
    asyncHandler(ctrl.listarJson)
);

module.exports = router;