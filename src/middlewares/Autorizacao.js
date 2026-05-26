/**
 * Autorizacao.js — Helpers de autorizacao por recurso
 */

const Conversa = require('../classes/Conversa');
const Validador = require('../utils/Validador');

/**
 * Carrega uma conversa e garante que o usuario participa dela.
 * 
 * @param {string} conversaId - id da conversa (vindo da rota)
 * @param {string|ObjectId} usuarioId - id do usuario logado
 * @returns {Promise<Conversa>} a conversa, se o acesso for permitido
 * @throws {Error} se o id for invalido, a conversa nao existir
 *                 ou o usuario nao for participante
 */
async function carregarConversaPermitida(conversaId, usuarioId) {
    Validador.validarId(conversaId);

    const conversa = await Conversa.buscarPorId(conversaId);
    if (!conversa) {
        throw new Error('Conversa não encontrada.');
    }

    if (!conversa.temParticipante(usuarioId)) {
        throw new Error('Você não tem acesso a esta conversa.');
    }

    return conversa;
}

module.exports = { carregarConversaPermitida };