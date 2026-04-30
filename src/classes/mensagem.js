/**
 * Classe Mensagem
 * Representa uma mensagem enviada em uma conversa
 */

class Mensagem {
    /**
     * Construtor da classe Mensagem
     * @param {Object} dados - dados da mensagem
     * @param {number} dados.id - identificador único
     * @param {number} dados.conversaId - id da conversa à qual pertence
     * @param {number} dados.remetenteId - id do usuário que enviou
     * @param {string} dados.conteudo - texto da mensagem
     * @param {string} dados.status - status ('enviada', 'entregue', 'lida')
     * @param {Date} dados.timestamp - data e hora de envio
     */
    constructor(dados = {}) {
        this.id = dados.id || null;
        this.conversaId = dados.conversaId || null;
        this.remetenteId = dados.remetenteId || null;
        this.conteudo = dados.conteudo || '';
        this.status = dados.status || 'enviada';
        this.timestamp = dados.timestamp || null;
    }

    /**
     * Envia (insere) uma nova mensagem no banco de dados
     * @returns {Promise<Mensagem>} mensagem criada com id atribuído
     * @throws {Error} se houver erro de validação ou banco
     */
    async enviar() {}

    /**
     * Busca uma mensagem pelo ID
     * @param {number} id - identificador da mensagem
     * @returns {Promise<Mensagem|null>} mensagem encontrada ou null
     */
    static async buscarPorId(id) {}

    /**
     * Lista todas as mensagens de uma conversa
     * @param {number} conversaId - id da conversa
     * @param {number} limite - quantidade máxima de mensagens (paginação)
     * @param {number} offset - deslocamento (paginação)
     * @returns {Promise<Mensagem[]>} lista de mensagens
     */
    static async buscarPorConversa(conversaId, limite = 50, offset = 0) {}

    /**
     * Busca mensagens em um intervalo de datas
     * @param {number} conversaId - id da conversa
     * @param {Date} dataInicio - data inicial
     * @param {Date} dataFim - data final
     * @returns {Promise<Mensagem[]>} lista de mensagens no intervalo
     */
    static async buscarPorIntervalo(conversaId, dataInicio, dataFim) {}

    /**
     * Busca mensagens contendo um texto específico
     * @param {number} conversaId - id da conversa
     * @param {string} texto - texto a ser buscado no conteúdo
     * @returns {Promise<Mensagem[]>} lista de mensagens encontradas
     */
    static async buscarPorTexto(conversaId, texto) {}

    /**
     * Atualiza o status da mensagem (entregue, lida)
     * @param {string} novoStatus - novo status da mensagem
     * @returns {Promise<Mensagem>} mensagem atualizada
     */
    async atualizarStatus(novoStatus) {}

    /**
     * Marca a mensagem como lida
     * @returns {Promise<Mensagem>} mensagem atualizada
     */
    async marcarComoLida() {}

    /**
     * Deleta a mensagem do banco de dados
     * @returns {Promise<boolean>} true se deletada com sucesso
     */
    async deletar() {}

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
