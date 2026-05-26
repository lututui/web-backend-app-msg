/**
 * index.js — Agregador de rotas
 */

const express = require('express');
const router = express.Router();

router.use(require('./Autenticacao.routes'));

router.use(require('./Conversas.routes'));
router.use(require('./Mensagens.routes'));
router.use(require('./Perfil.routes'));

module.exports = router;