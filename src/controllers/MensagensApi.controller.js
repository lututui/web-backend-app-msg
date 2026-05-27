/**
 * MensagensApi.controller.js — Endpoint JSON de mensagens
 *
 * NAO renderiza uma view: responde em JSON.
 * Navegador consulta esta rota a cada poucos segundos para descobrir 
 * se ha mensagens novas na conversa
 */

const Mensagem = require('../classes/Mensagem');
const Usuario = require('../classes/Usuario');
const { carregarConversaPermitida } = require('../middlewares/Autorizacao');
const { ehErroDeFormulario } = require('../utils/ValidacaoWeb');
const Logger = require('../utils/Logger');


// GET /api/conversas/:id/mensagens
async function listarJson(req, res) {
    try {
        const conversa = await carregarConversaPermitida(
            req.params.id,
            req.usuario.id
        );

        const mensagens = await Mensagem.buscarPorConversa(conversa.id);

        const nomes = {};
        
        async function nomeDe(id) {
            const chave = String(id);

            if (!nomes[chave]) {
                const u = await Usuario.buscarPorId(id);
                nomes[chave] = u ? u.nome : 'Usuário removido';
            }

            return nomes[chave];
        }

        const lista = [];
        for (const m of mensagens) {
            lista.push({
                id: String(m.id),
                conteudo: m.conteudo,
                status: m.status,
                timestamp: m.timestamp,
                remetenteNome: await nomeDe(m.remetenteId),
                ehMinha: m.remetenteId.toString() === String(req.usuario.id)
            });
        }

        res.json({ ok: true, mensagens: lista });
    } catch (erro) {
        Logger.error(erro, 'MensagensApi.listarJson');
        
        const status = ehErroDeFormulario(erro) ? 403 : 500;
        
        res.status(status).json({ ok: false, erro: erro.message });
    }
}

module.exports = { listarJson };