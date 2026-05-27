/**
 * Erros.js — Tratamento centralizado de erros
 *
 *   - naoEncontrado (404): nenhuma rota casou com a requisicao.
 *   - tratadorDeErro (500): erro nao tratado em qualquer ponto anterior.
 */

const Logger = require('../utils/Logger');

// 404
function naoEncontrado(req, res) {
    Logger.warning(
        `Rota nao encontrada: ${req.method} ${req.originalUrl}`,
        'Erros.naoEncontrado'
    );

    res.status(404).render('erros/404', {
        titulo: 'Pagina nao encontrada'
    });
}

// 500
function tratadorDeErro(erro, req, res, next) {
    Logger.error(erro, `Erros.tratadorDeErro [${req.method} ${req.originalUrl}]`);

    if (res.headersSent) {
        return next(erro);
    }

    res.status(500).render('erros/500', {
        titulo: 'Erro interno'
    });
}

module.exports = { naoEncontrado, tratadorDeErro };