/**
 * Flash.js — Mensagens temporarias
 *
 * Permite exibir mensagens de erro/sucesso apos um redirect.
 * As mensagens ficam guardadas dentro da sessao e aparecem apenas uma vez.
 *
 */

function flash(req, res, next) {
    if (!req.session.flash) {
        req.session.flash = { erro: [], sucesso: [] };
    }

    res.flash = function (tipo, mensagem) {
        if (!req.session.flash) {
            req.session.flash = { erro: [], sucesso: [] };
        }

        if (!req.session.flash[tipo]) {
            req.session.flash[tipo] = [];
        }
        req.session.flash[tipo].push(mensagem);
    };

    // Copia as mensagens acumuladas
    res.locals.flash = {
        erro: req.session.flash.erro || [],
        sucesso: req.session.flash.sucesso || []
    };

    // Remove as mensagens da sessao
    req.session.flash = { erro: [], sucesso: [] };

    next();
}

module.exports = flash;