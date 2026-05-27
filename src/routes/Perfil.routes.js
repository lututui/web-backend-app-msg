/**
 * Perfil.routes.js — Rotas de perfil e busca de usuarios
 */

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/Perfil.controller');
const asyncHandler = require('../middlewares/asyncHandler');
const { exigirLogin } = require('../middlewares/Autenticacao');

router.use(exigirLogin);

router.get('/perfil', asyncHandler(ctrl.formularioPerfil));
router.post('/perfil', asyncHandler(ctrl.atualizarPerfil));

router.get('/usuarios/buscar', asyncHandler(ctrl.buscarUsuarios));

module.exports = router;