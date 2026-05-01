/**
 * Classe Conversa
 * Representa uma conversa (individual ou em grupo) entre usuários
 */

const Conexao = require('../database/Conexao');
const Logger = require('../utils/Logger');
const Validador = require('../utils/Validador');

const Usuario = require('./Usuario');

const NOME_COLECAO = 'conversas';
const TIPOS_VALIDOS = ['individual', 'grupo'];

class Conversa {
    /**
     * Construtor da classe Conversa
     * @param {Object} dados - dados da conversa
     * @param {ObjectId|string} [dados._id] - identificador único
     * @param {string} [dados.nome] - nome da conversa (obrigatório para grupos)
     * @param {string} dados.tipo - tipo da conversa ('individual' ou 'grupo')
     * @param {Array<ObjectId|string>} dados.participantes - IDs dos usuários
     * @param {Date} [dados.dataCriacao] - data de criação da conversa
     */
    constructor(dados = {}) {
        this.id = dados.id || null;
        this.nome = dados.nome || '';
        this.tipo = dados.tipo || 'individual';
        this.participantes = dados.participantes || [];
        this.dataCriacao = dados.dataCriacao || null;
    }

    /**
     * Retorna a coleção de conversas do MongoDB
     * @returns {import('mongodb').Collection}
     * @private
     */
    static _colecao() {
        return Conexao.getColecao(NOME_COLECAO);
    }

    /**
     * Cria uma nova conversa no banco de dados
     * @returns {Promise<Conversa>} conversa criada com id atribuído
     * @throws {Error} se houver erro de validação ou banco
     */
    async criar() {
        try {
            Validador.validarEnum(this.tipo, TIPOS_VALIDOS, 'tipo');
            Validador.validarArrayNaoVazio(this.participantes, 'participantes');

            // Conversa individual deve ter exatamente 2 participantes
            if (this.tipo === 'individual' && this.participantes.length !== 2) {
                throw new Error(
                    'Conversa individual deve ter exatamente 2 participantes.'
                );
            }

            // Conversa em grupo deve ter pelo menos 2 usuários
            // Todo grupo deve ter um nome
            if (this.tipo === 'grupo') {
                if (this.participantes.length < 2) {
                    throw new Error('Conversa em grupo deve ter pelo menos 2 participantes.');
                }
                Validador.validarCampoObrigatorio(this.nome, 'nome');
                Validador.validarTamanho(this.nome, 2, 100, 'nome');
            }

            // Valida e converte cada ID de participante para ObjectId
            const participantesIds = this.participantes.map(id =>
                Validador.validarId(id)
            );

            // Verifica se todos os participantes existem
            for (const id of participantesIds) {
                const usuario = await Usuario.buscarPorId(id);
                if (!usuario) {
                    throw new Error(`Participante não encontrado: ${id}`);
                }
            }

            // Garante que não há IDs duplicados
            // Um usuário não pode participar mais de uma vez da mesma conversa
            const idsUnicos = new Set(participantesIds.map(id => id.toString()));
            if (idsUnicos.size !== participantesIds.length) {
                throw new Error('Lista de participantes contém IDs duplicados.');
            }

            this.participantes = participantesIds;
            this.dataCriacao = new Date();

            const documento = {
                nome: this.nome,
                tipo: this.tipo,
                participantes: this.participantes,
                dataCriacao: this.dataCriacao
            };

            const resultado = await Conversa._colecao().insertOne(documento);
            this.id = resultado.insertedId;

            Logger.info(
                `Conversa criada: ${this.id} (${this.tipo})`,
                'Conversa.criar'
            );
            return this;
        } catch (erro) {
            Logger.error(erro, 'Conversa.criar');
            throw erro;
        }
    }

    /**
     * Busca uma conversa pelo ID
     * @param {number} id - identificador da conversa
     * @returns {Promise<Conversa|null>} conversa encontrada ou null
     */
    static async buscarPorId(id) {
        try {
            const objectId = Validador.validarId(id);

            const documento = await Conversa._colecao().findOne({ _id: objectId });
            if (!documento) {
                return null;
            }

            return new Conversa(documento);
        } catch (erro) {
            Logger.error(erro, 'Conversa.buscarPorId');
            throw erro;
        }
    }

    /**
     * Lista todas as conversas de um usuário
     * @param {number} usuarioId - id do usuário
     * @returns {Promise<Conversa[]>} lista de conversas do usuário
     */
    static async listarPorUsuario(usuarioId) {
        try {
            const objectId = Validador.validarId(usuarioId);

            const documentos = await Conversa._colecao()
                .find({ participantes: objectId })
                .sort({ dataCriacao: -1 })
                .toArray();

            return documentos.map(doc => new Conversa(doc));
        } catch (erro) {
            Logger.error(erro, 'Conversa.listarPorUsuario');
            throw erro;
        }
    }

    /**
     * Verifica se um usuário é participante desta conversa
     * @param {string|ObjectId} usuarioId - id do usuário
     * @returns {boolean} true se for participante
     */
    temParticipante(usuarioId) {
        try {
            const objectId = Validador.validarId(usuarioId);
            return this.participantes.some(p => p.toString() === objectId.toString());
        } catch (erro) {
            Logger.error(erro, 'Conversa.temParticipante');
            return false;
        }
    }

    /**
     * Adiciona um participante à conversa
     * @param {number} usuarioId - id do usuário a ser adicionado
     * @returns {Promise<boolean>} true se adicionado com sucesso
     */
    async adicionarParticipante(usuarioId) {
        try {
            const conversaId = Validador.validarId(this.id);
            const novoParticipanteId = Validador.validarId(usuarioId);

            if (this.tipo !== 'grupo') {
                throw new Error('Só é possível adicionar participantes em grupos.');
            }

            const usuario = await Usuario.buscarPorId(novoParticipanteId);
            if (!usuario) {
                throw new Error(`Usuário não encontrado: ${usuarioId}`);
            }

            if (this.temParticipante(novoParticipanteId)) {
                throw new Error('Usuário já é participante desta conversa.');
            }

            const resultado = await Conversa._colecao().updateOne(
                { _id: conversaId },
                { $addToSet: { participantes: novoParticipanteId } }
            );

            if (resultado.matchedCount === 0) {
                throw new Error(`Conversa não encontrada: ${this.id}`);
            }

            this.participantes.push(novoParticipanteId);

            Logger.info(
                `Participante ${novoParticipanteId} adicionado à conversa ${this.id}`,
                'Conversa.adicionarParticipante'
            );
            return true;
        } catch (erro) {
            Logger.error(erro, 'Conversa.adicionarParticipante');
            throw erro;
        }
    }

    /**
     * Remove um participante da conversa
     * @param {number} usuarioId - id do usuário a ser removido
     * @returns {Promise<boolean>} true se removido com sucesso
     */
    async removerParticipante(usuarioId) {
        try {
            const conversaId = Validador.validarId(this.id);
            const participanteId = Validador.validarId(usuarioId);

            if (this.tipo !== 'grupo') {
                throw new Error('Só é possível remover participantes em grupos.');
            }

            if (!this.temParticipante(participanteId)) {
                throw new Error('Usuário não é participante desta conversa.');
            }

            // Não permite deixar o grupo com menos de 2 participantes
            // Ao invés de remover o participante, o grupo deve ser deletado
            if (this.participantes.length <= 2) {
                throw new Error(
                    'Não é possível remover participante: o grupo ficaria com menos de 2 membros.'
                );
            }

            const resultado = await Conversa._colecao().updateOne(
                { _id: conversaId },
                { $pull: { participantes: participanteId } }
            );

            if (resultado.matchedCount === 0) {
                throw new Error(`Conversa não encontrada: ${this.id}`);
            }

            this.participantes = this.participantes.filter(
                p => p.toString() !== participanteId.toString()
            );

            Logger.info(
                `Participante ${participanteId} removido da conversa ${this.id}`,
                'Conversa.removerParticipante'
            );
            return true;
        } catch (erro) {
            Logger.error(erro, 'Conversa.removerParticipante');
            throw erro;
        }
    }

    /**
     * Atualiza os dados da conversa
     * @returns {Promise<Conversa>} conversa atualizada
     */
    async atualizar() {
        try {
            const conversaId = Validador.validarId(this.id);

            if (this.tipo === 'grupo') {
                Validador.validarCampoObrigatorio(this.nome, 'nome');
                Validador.validarTamanho(this.nome, 2, 100, 'nome');
            }

            const resultado = await Conversa._colecao().updateOne(
                { _id: conversaId },
                { $set: { nome: this.nome } }
            );

            if (resultado.matchedCount === 0) {
                throw new Error(`Conversa não encontrada: ${this.id}`);
            }

            Logger.info(
                `Conversa atualizada: ${this.id}`,
                'Conversa.atualizar'
            );
            return this;
        } catch (erro) {
            Logger.error(erro, 'Conversa.atualizar');
            throw erro;
        }
    }

    /**
     * Deleta a conversa e todas as suas mensagens
     * @returns {Promise<boolean>} true se deletada com sucesso
     */
    async deletar() {
        try {
            const conversaId = Validador.validarId(this.id);

            // Deleta todas as mensagens da conversa primeiro
            // Importação dinâmica para evitar dependência circular
            const Mensagem = require('./Mensagem');
            const colecaoMensagens = Conexao.getColecao('mensagens');
            const resultadoMsgs = await colecaoMensagens.deleteMany({
                conversaId: conversaId
            });

            Logger.info(
                `${resultadoMsgs.deletedCount} mensagem(ns) deletada(s) da conversa ${this.id}`,
                'Conversa.deletar'
            );

            // Deleta a conversa
            const resultado = await Conversa._colecao().deleteOne({
                _id: conversaId
            });

            if (resultado.deletedCount === 0) {
                throw new Error(`Conversa não encontrada: ${this.id}`);
            }

            Logger.info(
                `Conversa deletada: ${this.id}`,
                'Conversa.deletar'
            );
            return true;
        } catch (erro) {
            Logger.error(erro, 'Conversa.deletar');
            throw erro;
        }
    }

    /**
     * Converte a instância para objeto simples
     * @returns {Object} representação em objeto da conversa
     */
    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            tipo: this.tipo,
            participantes: this.participantes,
            dataCriacao: this.dataCriacao
        };
    }
}

module.exports = Conversa;
