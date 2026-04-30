/**
 * Módulo responsável pela conexão com o MongoDB
 *
 * Driver: mongodb v7.2.0
 */

const { MongoClient, ServerApiVersion } = require('mongodb');
const Logger = require('../utils/Logger');

class Conexao {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;

        this.dbName = 'app_msg_db';
    }

    /**
     * Constrói a URI de conexão com base nas configurações
     * @returns {string} URI no formato mongodb://...
     * @private
     */
    _construirUri() {
        // Sem autenticação
        return `mongodb://localhost:27017`;
    }

    /**
     * Estabelece a conexão com o MongoDB
     * @returns {Promise<void>}
     * @throws {Error} se a conexão falhar
     */
    async conectar() {
        if (this.isConnected && this.client) {
            Logger.info('Conexão já estabelecida, reutilizando.', 'Conexao.conectar');
            return;
        }

        try {
            const uri = this._construirUri();

            const opcoes = {};

            this.client = new MongoClient(uri, opcoes);
            await this.client.connect();

            // Testar conexão
            // await this.client.db('admin').command({ ping: 1 });

            this.db = this.client.db(this.dbName);
            this.isConnected = true;

            Logger.info(
                `Conectado ao MongoDB - banco: ${this.dbName}`,
                'Conexao.conectar'
            );
        } catch (erro) {
            this.isConnected = false;
            this.client = null;
            this.db = null;
            Logger.error(erro, 'Conexao.conectar');
            throw new Error(`Falha ao conectar ao MongoDB: ${erro.message}`);
        }
    }

    /**
     * Encerra a conexão com o MongoDB
     * @returns {Promise<void>}
     */
    async desconectar() {
        if (!this.client || !this.isConnected) {
            Logger.warning(
                'Tentativa de desconectar sem conexão ativa.',
                'Conexao.desconectar'
            );
            return;
        }

        try {
            await this.client.close();
            this.client = null;
            this.db = null;
            this.isConnected = false;

            Logger.info('Conexão com MongoDB encerrada.', 'Conexao.desconectar');
        } catch (erro) {
            Logger.error(erro, 'Conexao.desconectar');
            throw new Error(`Falha ao desconectar do MongoDB: ${erro.message}`);
        }
    }

    /**
     * Retorna a instância ativa do banco de dados (Db)
     * @returns {import('mongodb').Db} instância do banco
     * @throws {Error} se a conexão não estiver ativa
     */
    getDB() {
        if (!this.isConnected || !this.db) {
            const erro = new Error(
                'Conexão com o banco não está ativa. Chame conectar() primeiro.'
            );
            Logger.error(erro, 'Conexao.getDB');
            throw erro;
        }
        return this.db;
    }

    /**
     * Retorna uma coleção do banco de dados
     * @param {string} nomeColecao - nome da coleção desejada
     * @returns {import('mongodb').Collection} coleção solicitada
     * @throws {Error} se a conexão não estiver ativa ou nome inválido
     */
    getColecao(nomeColecao) {
        if (!nomeColecao || typeof nomeColecao !== 'string') {
            const erro = new Error('Nome da coleção é obrigatório e deve ser uma string.');
            Logger.error(erro, 'Conexao.getColecao');
            throw erro;
        }

        const db = this.getDB();
        return db.collection(nomeColecao);
    }

    /**
     * Retorna o cliente MongoClient ativo
     * Útil para operações avançadas como transações
     * @returns {import('mongodb').MongoClient} instância do cliente
     * @throws {Error} se a conexão não estiver ativa
     */
    getClient() {
        if (!this.isConnected || !this.client) {
            const erro = new Error(
                'Cliente MongoDB não está disponível. Chame conectar() primeiro.'
            );
            Logger.error(erro, 'Conexao.getClient');
            throw erro;
        }
        return this.client;
    }

    /**
     * Verifica se a conexão está ativa enviando um ping ao servidor
     * @returns {Promise<boolean>} true se a conexão está ativa
     */
    async estaAtiva() {
        if (!this.client || !this.isConnected) {
            return false;
        }

        try {
            await this.client.db('admin').command({ ping: 1 });
            return true;
        } catch (erro) {
            Logger.warning(
                `Ping falhou: ${erro.message}`,
                'Conexao.estaAtiva'
            );
            return false;
        }
    }
}

// Singleton
module.exports = new Conexao();