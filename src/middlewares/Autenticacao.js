/**
 * Autenticacao.js
 */

const Usuario = require('../classes/Usuario');
const Logger = require('../utils/Logger');

/**
 * carregarUsuario: Se houver usuarioId na sessao, carrega o usuario
 *   do banco em req.usuario e o expoe as views em res.locals.usuarioLogado.
 *   Sem login, segue sem usuario.
 */
async function carregarUsuario(req, res, next) {
    req.usuario = null;
    res.locals.usuarioLogado = null;

    // Visitante sem login
    if (!req.session || !req.session.usuarioId) {
        return next();
    }

    try {
        const usuario = await Usuario.buscarPorId(req.session.usuarioId);

        if (usuario) {
            req.usuario = usuario;
            res.locals.usuarioLogado = usuario.toJSON();
        } else {
            delete req.session.usuarioId;
        }
    } catch (erro) {
        Logger.error(erro, 'Autenticacao.carregarUsuario');
    }

    next();
}

/**
 * exigirLogin: Redireciona quem nao esta logado para a tela de login.
 */
function exigirLogin(req, res, next) {
    if (!req.usuario) {
        res.flash('erro', 'Faca login para continuar.');
        return res.redirect('/login');
    }
    next();
}

module.exports = { carregarUsuario, exigirLogin };