/**
 * Módulo de validação de dados
 */

const { ObjectId } = require('mongodb');

class Validador {
    /**
     * Verifica se um campo obrigatório está preenchido
     * @param {*} valor - valor a ser validado
     * @param {string} nomeCampo - nome do campo (para mensagem de erro)
     * @throws {Error} se o campo estiver vazio
     */
    static validarCampoObrigatorio(valor, nomeCampo) {
        if (valor === null || valor === undefined || (typeof valor === 'string' && valor.trim().length === 0)) {
            throw new Error(`Campo obrigatório não preenchido: ${nomeCampo}`);
        }
    }

    /**
     * Valida formato de telefone (apenas dígitos, 10 a 15 caracteres)
     * Aceita formatos com ou sem código do país
     * @param {string} telefone - telefone a ser validado
     * @throws {Error} se o telefone for inválido
     */
    static validarTelefone(telefone) {
        Validador.validarCampoObrigatorio(telefone, 'telefone');

        // Remove espaços, parênteses, traços e o sinal de mais para validação
        const limpo = String(telefone).replace(/[\s()\-+]/g, '');

        if (!/^\d{10,15}$/.test(limpo)) {
            throw new Error(`Telefone inválido: ${telefone}.`);
        }
    }

    /**
     * Valida formato de email
     * @param {string} email - email a ser validado
     * @throws {Error} se o email for inválido
     */
    static validarEmail(email) {
        Validador.validarCampoObrigatorio(email, 'email');

        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            throw new Error(`Email inválido: ${email}`);
        }
    }

    /**
     * Valida tamanho mínimo e máximo de uma string
     * @param {string} valor - valor a ser validado
     * @param {number} min - tamanho mínimo
     * @param {number} max - tamanho máximo
     * @param {string} nomeCampo - nome do campo (para mensagem de erro)
     * @throws {Error} se o tamanho for inválido
     */
    static validarTamanho(valor, min, max, nomeCampo) {
        Validador.validarCampoObrigatorio(valor, nomeCampo);

        const tamanho = String(valor).length;
        if (tamanho < min || tamanho > max) {
            throw new Error(
                `Campo '${nomeCampo}' deve ter entre ${min} e ${max} caracteres (atual: ${tamanho}).`
            );
        }
    }

    /**
     * Valida se um ID é um ObjectId válido do MongoDB
     * @param {*} id - id a ser validado (pode ser string ou ObjectId)
     * @returns {ObjectId} o id convertido para ObjectId
     * @throws {Error} se o id for inválido
     */
    static validarId(id) {
        if (id === null || id === undefined) {
            throw new Error('ID é obrigatório.');
        }

        if (id instanceof ObjectId) {
            return id;
        }

        if (!ObjectId.isValid(id)) {
            throw new Error(`ID inválido: ${id}`);
        }

        return new ObjectId(id);
    }

    /**
     * Valida se um valor está dentro de uma lista de valores permitidos
     * @param {*} valor - valor a validar
     * @param {Array} permitidos - lista de valores permitidos
     * @param {string} nomeCampo - nome do campo (para mensagem de erro)
     * @throws {Error} se o valor não estiver na lista
     */
    static validarEnum(valor, permitidos, nomeCampo) {
        if (!permitidos.includes(valor)) {
            throw new Error(
                `Valor inválido para '${nomeCampo}': ${valor}. ` +
                `Permitidos: ${permitidos.join(', ')}.`
            );
        }
    }

    /**
     * Valida se um valor é um array não-vazio
     * @param {*} valor - valor a validar
     * @param {string} nomeCampo - nome do campo (para mensagem de erro)
     * @throws {Error} se não for um array ou estiver vazio
     */
    static validarArrayNaoVazio(valor, nomeCampo) {
        if (!Array.isArray(valor) || valor.length === 0) {
            throw new Error(
                `Campo '${nomeCampo}' deve ser uma lista não-vazia.`
            );
        }
    }

    /**
     * Valida se um valor é uma data válida
     * @param {*} valor - valor a validar
     * @param {string} nomeCampo - nome do campo (para mensagem de erro)
     * @returns {Date} a data convertida
     * @throws {Error} se não for uma data válida
     */
    static validarData(valor, nomeCampo) {
        if (valor === null || valor === undefined) {
            throw new Error(`Campo '${nomeCampo}' é obrigatório.`);
        }

        const data = valor instanceof Date ? valor : new Date(valor);
        if (isNaN(data.getTime())) {
            throw new Error(`Data inválida em '${nomeCampo}': ${valor}`);
        }

        return data;
    }
}

module.exports = Validador;