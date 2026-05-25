/**
 * Senha.js — Hash e verificacao de senhas
 */

const crypto = require('crypto');

// Tamanho do salt e do hash
const TAMANHO_SALT = 16;
const TAMANHO_HASH = 64;

/**
 * Gera o hash de uma senha em texto puro.
 * @param {string} senha - senha em texto puro
 * @returns {{ hash: string, salt: string }} hash e salt em hexadecimal
 */
function gerarHash(senha) {
    const salt = crypto.randomBytes(TAMANHO_SALT).toString('hex');
    const hash = crypto.scryptSync(senha, salt, TAMANHO_HASH).toString('hex');
    return { hash, salt };
}

/**
 * Verifica se uma senha.
 * @param {string} senha - senha em texto puro digitada no login
 * @param {string} hash - hash armazenado no usuario
 * @param {string} salt - salt armazenado no usuario
 * @returns {boolean} true se a senha confere
 */
function verificar(senha, hash, salt) {
    if (!senha || !hash || !salt) {
        return false;
    }

    const hashCalculado = crypto
        .scryptSync(senha, salt, TAMANHO_HASH)
        .toString('hex');

    const bufferArmazenado = Buffer.from(hash, 'hex');
    const bufferCalculado = Buffer.from(hashCalculado, 'hex');

    if (bufferArmazenado.length !== bufferCalculado.length) {
        return false;
    }

    return crypto.timingSafeEqual(bufferArmazenado, bufferCalculado);
}

module.exports = { gerarHash, verificar };