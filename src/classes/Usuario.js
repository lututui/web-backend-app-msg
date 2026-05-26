/**
 * Classe Usuario
 * Representa um usuário do sistema de mensagens instantâneas
 */

const Conexao = require('../database/Conexao');
const Logger = require('../utils/Logger');
const Validador = require('../utils/Validador');

const NOME_COLECAO = 'usuarios';

class Usuario {
    /**
     * Construtor da classe Usuario
     * @param {Object} dados - dados do usuário
     * @param {ObjectId|string} [dados._id] - identificador único (gerado pelo MongoDB)
     * @param {string} dados.nome - nome do usuário
     * @param {string} dados.telefone - telefone do usuário
     * @param {string} [dados.email] - email do usuário (opcional)
     * @param {Date} [dados.dataCriacao] - data de criação do registro
     * @param {string} [dados.senhaHash] - hash da senha
     * @param {string} [dados.senhaSalt] - salt usado no hash da senha
     */
    constructor(dados = {}) {
        this.id = dados.id || dados._id || null;
        this.nome = dados.nome || '';
        this.telefone = dados.telefone || '';
        this.email = dados.email || '';
        this.dataCriacao = dados.dataCriacao || null;

        this.senhaHash = dados.senhaHash || '';
        this.senhaSalt = dados.senhaSalt || '';
    }

    /**
     * Retorna a coleção de usuários do MongoDB
     * @returns {import('mongodb').Collection}
     * @private
     */
    static _colecao() {
        return Conexao.getColecao(NOME_COLECAO);
    }

    /**
     * Insere um novo usuário no banco de dados
     * @returns {Promise<Usuario>} usuário criado com id atribuído
     * @throws {Error} se houver erro de validação ou banco
     */
    async criar() {
        try {
            // Validação de campos obrigatórios
            Validador.validarCampoObrigatorio(this.nome, 'nome');
            Validador.validarTamanho(this.nome, 2, 100, 'nome');
            Validador.validarTelefone(this.telefone);

            // Validar campo opcional (email)
            if (this.email && this.email.length > 0) {
                Validador.validarEmail(this.email);
            }

            // Telefone deve ser unico
            const existente = await Usuario.buscarPorTelefone(this.telefone);
            if (existente) {
                throw new Error(`Telefone já cadastrado: ${this.telefone}`);
            }

            this.dataCriacao = new Date();

            const documento = {
                nome: this.nome,
                telefone: this.telefone,
                email: this.email,
                dataCriacao: this.dataCriacao
            };

            if (this.senhaHash && this.senhaSalt) {
                documento.senhaHash = this.senhaHash;
                documento.senhaSalt = this.senhaSalt;
            }

            const resultado = await Usuario._colecao().insertOne(documento);
            this.id = resultado.insertedId;

            Logger.info(
                `Usuário criado: ${this.nome} (${this.id})`,
                'Usuario.criar'
            );
            return this;
        } catch (erro) {
            Logger.error(erro, 'Usuario.criar');
            throw erro;
        }
    }

    /**
     * Busca um usuário pelo ID
     * @param {number} id - identificador do usuário
     * @returns {Promise<Usuario|null>} usuário encontrado ou null
     * @throws {Error} se houver erro no banco
     */
    static async buscarPorId(id) {
        try {
            const objectId = Validador.validarId(id);

            const documento = await Usuario._colecao().findOne({ _id: objectId });
            if (!documento) {
                return null;
            }

            return new Usuario(documento);
        } catch (erro) {
            Logger.error(erro, 'Usuario.buscarPorId');
            throw erro;
        }
    }

    /**
     * Busca um usuário pelo telefone
     * @param {string} telefone - telefone do usuário
     * @returns {Promise<Usuario|null>} usuário encontrado ou null
     */
    static async buscarPorTelefone(telefone) {
        try {
            Validador.validarCampoObrigatorio(telefone, 'telefone');

            const documento = await Usuario._colecao().findOne({ telefone });
            if (!documento) {
                return null;
            }

            return new Usuario(documento);
        } catch (erro) {
            Logger.error(erro, 'Usuario.buscarPorTelefone');
            throw erro;
        }
    }

    /**
     * Lista todos os usuários cadastrados
     * @returns {Promise<Usuario[]>} lista de usuários
     */
    static async listarTodos() {
        try {
            const documentos = await Usuario._colecao()
                .find({})
                .sort({ nome: 1 })
                .toArray();

            return documentos.map(doc => new Usuario(doc));
        } catch (erro) {
            Logger.error(erro, 'Usuario.listarTodos');
            throw erro;
        }
    }

    /**
     * Busca usuários por nome (busca parcial, case-insensitive)
     * @param {string} nome - parte do nome a buscar
     * @returns {Promise<Usuario[]>} lista de usuários encontrados
     */
    static async buscarPorNome(nome) {
        try {
            Validador.validarCampoObrigatorio(nome, 'nome');

            // Escapa caracteres especiais de regex e busca case-insensitive
            const nomeEscapado = nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const documentos = await Usuario._colecao()
                .find({ nome: { $regex: nomeEscapado, $options: 'i' } })
                .toArray();

            return documentos.map(doc => new Usuario(doc));
        } catch (erro) {
            Logger.error(erro, 'Usuario.buscarPorNome');
            throw erro;
        }
    }

    /**
     * Atualiza os dados do usuário no banco
     * @returns {Promise<Usuario>} usuário atualizado
     */
    async atualizar() {
        try {
            const objectId = Validador.validarId(this.id);

            Validador.validarCampoObrigatorio(this.nome, 'nome');
            Validador.validarTamanho(this.nome, 2, 100, 'nome');
            Validador.validarTelefone(this.telefone);
 
            if (this.email && this.email.length > 0) {
                Validador.validarEmail(this.email);
            }

            const campos = {
                nome: this.nome,
                telefone: this.telefone,
                email: this.email
            };

            if (this.senhaHash && this.senhaSalt) {
                campos.senhaHash = this.senhaHash;
                campos.senhaSalt = this.senhaSalt;
            }
 
            const resultado = await Usuario._colecao().updateOne(
                { _id: objectId },
                { $set: campos }
            );
 
            if (resultado.matchedCount === 0) {
                throw new Error(`Usuário não encontrado: ${this.id}`);
            }
 
            Logger.info(
                `Usuário atualizado: ${this.id}`,
                'Usuario.atualizar'
            );
            return this;
        } catch (erro) {
            Logger.error(erro, 'Usuario.atualizar');
            throw erro;
        }
    }

    /**
     * Deleta o usuário do banco de dados
     * @returns {Promise<boolean>} true se deletado com sucesso
     */
    async deletar() {
        try {
            const objectId = Validador.validarId(this.id);
 
            const resultado = await Usuario._colecao().deleteOne({ _id: objectId });
 
            if (resultado.deletedCount === 0) {
                throw new Error(`Usuário não encontrado: ${this.id}`);
            }
 
            Logger.info(
                `Usuário deletado: ${this.id}`,
                'Usuario.deletar'
            );
            return true;
        } catch (erro) {
            Logger.error(erro, 'Usuario.deletar');
            throw erro;
        }
    }

    /**
     * Converte a instância para objeto simples
     * @returns {Object} representação em objeto do usuário
     */
    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            telefone: this.telefone,
            email: this.email,
            dataCriacao: this.dataCriacao
        };
    }
}

module.exports = Usuario;
