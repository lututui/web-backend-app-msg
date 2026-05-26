/**
 * Perfil.routes.js — Rotas de perfil e busca de usuarios
 */

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/Perfil.controller');
const { exigirLogin } = require('../middlewares/Autenticacao');

router.use(exigirLogin);

router.get('/perfil', ctrl.formularioPerfil);
router.post('/perfil', ctrl.atualizarPerfil);

router.get('/usuarios/buscar', ctrl.buscarUsuarios);

module.exports = router;