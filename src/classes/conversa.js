/**
 * Classe Conversa
 * Representa uma conversa (individual ou em grupo) entre usuários
 */


class Conversa {
    /**
     * Construtor da classe Conversa
     * @param {Object} dados - dados da conversa
     * @param {number} dados.id - identificador único
     * @param {string} dados.nome - nome da conversa (para grupos)
     * @param {string} dados.tipo - tipo da conversa ('individual' ou 'grupo')
     * @param {Array<number>} dados.participantes - IDs dos usuários participantes
     * @param {Date} dados.dataCriacao - data de criação da conversa
     */
    constructor(dados = {}) {
        this.id = dados.id || null;
        this.nome = dados.nome || '';
        this.tipo = dados.tipo || 'individual';
        this.participantes = dados.participantes || [];
        this.dataCriacao = dados.dataCriacao || null;
    }

    /**
     * Cria uma nova conversa no banco de dados
     * @returns {Promise<Conversa>} conversa criada com id atribuído
     * @throws {Error} se houver erro de validação ou banco
     */
    async criar() {}

    /**
     * Busca uma conversa pelo ID
     * @param {number} id - identificador da conversa
     * @returns {Promise<Conversa|null>} conversa encontrada ou null
     */
    static async buscarPorId(id) {}

    /**
     * Lista todas as conversas de um usuário
     * @param {number} usuarioId - id do usuário
     * @returns {Promise<Conversa[]>} lista de conversas do usuário
     */
    static async listarPorUsuario(usuarioId) {}

    /**
     * Adiciona um participante à conversa
     * @param {number} usuarioId - id do usuário a ser adicionado
     * @returns {Promise<boolean>} true se adicionado com sucesso
     */
    async adicionarParticipante(usuarioId) {}

    /**
     * Remove um participante da conversa
     * @param {number} usuarioId - id do usuário a ser removido
     * @returns {Promise<boolean>} true se removido com sucesso
     */
    async removerParticipante(usuarioId) {}

    /**
     * Atualiza os dados da conversa
     * @returns {Promise<Conversa>} conversa atualizada
     */
    async atualizar() {}

    /**
     * Deleta a conversa e todas as suas mensagens
     * @returns {Promise<boolean>} true se deletada com sucesso
     */
    async deletar() {}

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
