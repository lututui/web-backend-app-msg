/**
 * ResolvedorNomes.js — Cache local de nomes de usuario por requisicao
 */

const Usuario = require('../classes/Usuario');

/**
 * Cria um resolvedor de nomes com cache local.
 * 
 * @returns {(id: any) => Promise<string>} funcao que devolve o nome do
 *   usuario, consultando o banco apenas na primeira vez para cada id.
 */
function criar() {
    const cache = {};

    return async function resolverNome(id) {
        const chave = String(id);

        if (!cache[chave]) {
            const u = await Usuario.buscarPorId(id);
            cache[chave] = u ? u.nome : 'Usuário removido';
        }
        
        return cache[chave];
    };
}

module.exports = { criar };