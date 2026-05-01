/**
 * Classe Mensagem
 * Representa uma mensagem enviada em uma conversa
 */

const Conexao = require('../database/Conexao');
const Logger = require('../utils/Logger');
const Validador = require('../utils/Validador');

const Conversa = require('./Conversa');

const NOME_COLECAO = 'mensagens';
const STATUS_VALIDOS = ['enviada', 'entregue', 'lida'];
const TAMANHO_MAX_CONTEUDO = 4000;

class Mensagem {
    /**
     * Construtor da classe Mensagem
     * @param {Object} dados - dados da mensagem
     * @param {ObjectId|string} [dados.id] - identificador único
     * @param {ObjectId|string} dados.conversaId - id da conversa
     * @param {ObjectId|string} dados.remetenteId - id do usuário que enviou
     * @param {string} dados.conteudo - texto da mensagem
     * @param {string} [dados.status] - status ('enviada', 'entregue', 'lida')
     * @param {Date} [dados.timestamp] - data e hora de envio
     */
    constructor(dados = {}) {
        this.id = dados.id || dados._id || null;
        this.conversaId = dados.conversaId || null;
        this.remetenteId = dados.remetenteId || null;
        this.conteudo = dados.conteudo || '';
        this.status = dados.status || 'enviada';
        this.timestamp = dados.timestamp || null;
    }

    /**
     * Retorna a coleção de mensagens do MongoDB
     * @returns {import('mongodb').Collection}
     * @private
     */
    static _colecao() {
        return Conexao.getColecao(NOME_COLECAO);
    }

    /**
     * Envia (insere) uma nova mensagem no banco de dados
     * @returns {Promise<Mensagem>} mensagem criada com id atribuído
     * @throws {Error} se houver erro de validação ou banco
     */
    async enviar() {
        try {
            const conversaId = Validador.validarId(this.conversaId);
            const remetenteId = Validador.validarId(this.remetenteId);

            Validador.validarCampoObrigatorio(this.conteudo, 'conteudo');
            Validador.validarTamanho(
                this.conteudo,
                1,
                TAMANHO_MAX_CONTEUDO,
                'conteudo'
            );

            const conversa = await Conversa.buscarPorId(conversaId);
            if (!conversa) {
                throw new Error(`Conversa não encontrada: ${this.conversaId}`);
            }

            if (!conversa.temParticipante(remetenteId)) {
                throw new Error(
                    `Remetente ${this.remetenteId} não é participante da conversa.`
                );
            }

            this.conversaId = conversaId;
            this.remetenteId = remetenteId;
            this.status = 'enviada';
            this.timestamp = new Date();

            const documento = {
                conversaId: this.conversaId,
                remetenteId: this.remetenteId,
                conteudo: this.conteudo,
                status: this.status,
                timestamp: this.timestamp
            };

            const resultado = await Mensagem._colecao().insertOne(documento);
            this.id = resultado.insertedId;

            Logger.info(
                `Mensagem enviada: ${this.id} (conversa ${this.conversaId})`,
                'Mensagem.enviar'
            );
            return this;
        } catch (erro) {
            Logger.error(erro, 'Mensagem.enviar');
            throw erro;
        }
    }

    /**
     * Busca uma mensagem pelo ID
     * @param {number} id - identificador da mensagem
     * @returns {Promise<Mensagem|null>} mensagem encontrada ou null
     */
    static async buscarPorId(id) {
        try {
            const objectId = Validador.validarId(id);

            const documento = await Mensagem._colecao().findOne({ _id: objectId });
            if (!documento) {
                return null;
            }

            return new Mensagem(documento);
        } catch (erro) {
            Logger.error(erro, 'Mensagem.buscarPorId');
            throw erro;
        }
    }

    /**
     * Lista todas as mensagens de uma conversa
     * @param {number} conversaId - id da conversa
     * @param {number} limite - quantidade máxima de mensagens (paginação)
     * @param {number} offset - deslocamento (paginação)
     * @returns {Promise<Mensagem[]>} lista de mensagens
     */
    static async buscarPorConversa(conversaId, limite = 50, offset = 0) {
        try {
            const objectId = Validador.validarId(conversaId);

            if (typeof limite !== 'number' || limite < 1) {
                throw new Error('Limite deve ser maior que 1.');
            }

            if (typeof offset !== 'number' || offset < 0) {
                throw new Error('Offset deve ser um número não-negativo.');
            }

            const documentos = await Mensagem._colecao()
                .find({ conversaId: objectId })
                .sort({ timestamp: 1 })
                .skip(offset)
                .limit(limite)
                .toArray();

            return documentos.map(doc => new Mensagem(doc));
        } catch (erro) {
            Logger.error(erro, 'Mensagem.buscarPorConversa');
            throw erro;
        }
    }

    /**
     * Busca mensagens em um intervalo de datas
     * @param {number} conversaId - id da conversa
     * @param {Date} dataInicio - data inicial
     * @param {Date} dataFim - data final
     * @returns {Promise<Mensagem[]>} lista de mensagens no intervalo
     */
    static async buscarPorIntervalo(conversaId, dataInicio, dataFim) {
        try {
            const objectId = Validador.validarId(conversaId);
            const inicio = Validador.validarData(dataInicio, 'dataInicio');
            const fim = Validador.validarData(dataFim, 'dataFim');

            if (inicio > fim) {
                throw new Error('dataInicio deve ser anterior ou igual a dataFim.');
            }

            const documentos = await Mensagem._colecao()
                .find({
                    conversaId: objectId,
                    timestamp: { $gte: inicio, $lte: fim }
                })
                .sort({ timestamp: 1 })
                .toArray();

            return documentos.map(doc => new Mensagem(doc));
        } catch (erro) {
            Logger.error(erro, 'Mensagem.buscarPorIntervalo');
            throw erro;
        }
    }

    /**
     * Busca mensagens contendo um texto específico
     * @param {number} conversaId - id da conversa
     * @param {string} texto - texto a ser buscado no conteúdo
     * @returns {Promise<Mensagem[]>} lista de mensagens encontradas
     */
    static async buscarPorTexto(conversaId, texto) {
        try {
            const objectId = Validador.validarId(conversaId);
            Validador.validarCampoObrigatorio(texto, 'texto');

            // Escapa caracteres especiais de regex
            const textoEscapado = texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const documentos = await Mensagem._colecao()
                .find({
                    conversaId: objectId,
                    conteudo: { $regex: textoEscapado, $options: 'i' }
                })
                .sort({ timestamp: 1 })
                .toArray();

            return documentos.map(doc => new Mensagem(doc));
        } catch (erro) {
            Logger.error(erro, 'Mensagem.buscarPorTexto');
            throw erro;
        }
    }

    /**
     * Atualiza o status da mensagem (entregue, lida)
     * @param {string} novoStatus - novo status da mensagem
     * @returns {Promise<Mensagem>} mensagem atualizada
     */
    async atualizarStatus(novoStatus) {
        try {
            const objectId = Validador.validarId(this.id);
            Validador.validarEnum(novoStatus, STATUS_VALIDOS, 'status');

            const resultado = await Mensagem._colecao().updateOne(
                { _id: objectId },
                { $set: { status: novoStatus } }
            );

            if (resultado.matchedCount === 0) {
                throw new Error(`Mensagem não encontrada: ${this.id}`);
            }

            this.status = novoStatus;

            Logger.info(
                `Status da mensagem ${this.id} atualizado para '${novoStatus}'`,
                'Mensagem.atualizarStatus'
            );
            return this;
        } catch (erro) {
            Logger.error(erro, 'Mensagem.atualizarStatus');
            throw erro;
        }
    }

    /**
     * Marca a mensagem como lida
     * @returns {Promise<Mensagem>} mensagem atualizada
     */
    async marcarComoLida() {
        return this.atualizarStatus('lida');
    }

    /**
     * Deleta a mensagem do banco de dados
     * @returns {Promise<boolean>} true se deletada com sucesso
     */
    async deletar() {
        try {
            const objectId = Validador.validarId(this.id);

            const resultado = await Mensagem._colecao().deleteOne({ _id: objectId });

            if (resultado.deletedCount === 0) {
                throw new Error(`Mensagem não encontrada: ${this.id}`);
            }

            Logger.info(
                `Mensagem deletada: ${this.id}`,
                'Mensagem.deletar'
            );
            return true;
        } catch (erro) {
            Logger.error(erro, 'Mensagem.deletar');
            throw erro;
        }
    }

    /**
     * Converte a instância para objeto simples
     * @returns {Object} representação em objeto da mensagem
     */
    toJSON() {
        return {
            id: this.id,
            conversaId: this.conversaId,
            remetenteId: this.remetenteId,
            conteudo: this.conteudo,
            status: this.status,
            timestamp: this.timestamp
        };
    }
}

module.exports = Mensagem;
