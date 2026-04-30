/**
 * Classe Usuario
 * Representa um usuário do sistema de mensagens instantâneas
 */

class Usuario {
    /**
     * Construtor da classe Usuario
     * @param {Object} dados - dados do usuário
     * @param {number} dados.id - identificador único
     * @param {string} dados.nome - nome do usuário
     * @param {string} dados.telefone - telefone do usuário
     * @param {string} dados.email - email do usuário
     * @param {Date} dados.dataCriacao - data de criação do registro
     */
    constructor(dados = {}) {
        this.id = dados.id || null;
        this.nome = dados.nome || '';
        this.telefone = dados.telefone || '';
        this.email = dados.email || '';
        this.dataCriacao = dados.dataCriacao || null;
    }

    /**
     * Insere um novo usuário no banco de dados
     * @returns {Promise<Usuario>} usuário criado com id atribuído
     * @throws {Error} se houver erro de validação ou banco
     */
    async criar() {}

    /**
     * Busca um usuário pelo ID
     * @param {number} id - identificador do usuário
     * @returns {Promise<Usuario|null>} usuário encontrado ou null
     * @throws {Error} se houver erro no banco
     */
    static async buscarPorId(id) {}

    /**
     * Busca um usuário pelo telefone
     * @param {string} telefone - telefone do usuário
     * @returns {Promise<Usuario|null>} usuário encontrado ou null
     */
    static async buscarPorTelefone(telefone) {}

    /**
     * Lista todos os usuários cadastrados
     * @returns {Promise<Usuario[]>} lista de usuários
     */
    static async listarTodos() {}

    /**
     * Atualiza os dados do usuário no banco
     * @returns {Promise<Usuario>} usuário atualizado
     */
    async atualizar() {}

    /**
     * Deleta o usuário do banco de dados
     * @returns {Promise<boolean>} true se deletado com sucesso
     */
    async deletar() {}

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
