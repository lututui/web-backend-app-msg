/**
 * asyncHandler.js — Captura automatica de erros em controllers async
 *
 * @param {Function} controlador - funcao de controller async
 * @returns {Function} funcao de rota protegida contra rejeicoes
 */
function asyncHandler(controlador) {
    return function (req, res, next) {
        Promise.resolve(controlador(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;