# Roteiro de Testes Manuais - Projeto 2

## Preparação

1. MongoDB rodando em `localhost:27017`.
2. `npm install` executado.
3. Servidor no ar: `npm start`. Aguardar a mensagem `Servidor disponível
   em http://localhost:3000`.
4. Abrir o navegador em `http://localhost:3000`. Deve redirecionar para
   `/login`.

## R1 - Cadastro e login

**Objetivo:** validar a rotina de login (critério obrigatório).

1. Em `/cadastro`, criar **Ana** (telefone `43911111111`, senha `senha123`).
2. Em `/cadastro`, criar **Bruno** (telefone `43922222222`, senha `senha123`).
3. Em `/cadastro`, criar **Carla** (telefone `43933333333`, senha `senha123`).
4. Em `/login`, entrar como **Ana**.

**Esperado:** após o login, redirect para `/conversas` com mensagem de boas-vindas em verde.

## R2 - Validação de cadastro

**Objetivo:** validar o critério de "verificação de preenchimento e apresentação de mensagens de erro".

Sem estar logado, em `/cadastro`, :

| # | Ação | Esperado |
|---|---|---|
| 1 | Submeter formulário vazio | Lista de erros (nome, telefone, senha obrigatórios) |
| 2 | Nome com 1 caractere | Erro de tamanho mínimo |
| 3 | Telefone `abc` | Erro de telefone inválido |
| 4 | E-mail `xyz` (sem `@`) | Erro de e-mail inválido |
| 5 | Senha com 3 caracteres | Erro de tamanho mínimo |
| 6 | Senha ≠ confirmação | Mensagem de "não coincidem" |
| 7 | Telefone já existente (ex.: `43911111111`) | "Telefone já cadastrado" |

Em todos os casos, os valores digitados (exceto senha) devem voltar preenchidos no formulário re-exibido.

---

## R3 - Validação de login

| # | Ação | Esperado |
|---|---|---|
| 1 | `/login` com campos vazios | Erros: telefone e senha obrigatórios |
| 2 | Telefone inexistente | "Telefone ou senha inválidos" |
| 3 | Telefone certo + senha errada | "Telefone ou senha inválidos" |
| 4 | Telefone certo + senha certa | Redirect para `/conversas` |

## R4 - Conversa individual

Logado como Ana:

1. Em `/conversas`, clicar "Nova conversa".
2. Selecionar Bruno → "Iniciar conversa".
3. Enviar "Oi Bruno". Verificar que o balão aparece à direita, em verde.
4. Voltar para `/conversas`. Confirmar que a conversa aparece na lista com avatar `@` (individual).
5. Reabrir a conversa. A mensagem continua lá.
6. Sair.
7. Logar como Bruno.
7. Em `/conversas`, abrir a conversa com Ana. A mensagem de Ana aparece à esquerda.
8. Responder "Oi Ana". Voltar e abrir como Ana para ver a resposta.

## R5 - Conversa em grupo

Logado como Ana:

1. Em `/conversas`, clicar "Novo grupo".
2. Nome do grupo: "Trabalho Backend". Marcar Bruno e Carla. Criar.
3. Enviar "Reunião amanhã". Verificar que aparece como mensagem própria.
4. Em `/conversas`, o grupo aparece com avatar `#`.
5. Clicar em "Membros" no cabeçalho do grupo. Verificar que aparece:
   - Ana (você), Bruno, Carla
   - Botão "Remover" só nos outros (não em Ana)
   - Select de adicionar disponível
   - Botão "Excluir grupo" no fim

## R6 - Validação de criação de conversa/grupo

| # | Ação | Esperado |
|---|---|---|
| 1 | `/conversas/nova` sem selecionar ninguém | Erro: "Selecione ao menos um participante" |
| 2 | `/conversas/grupo` sem nome | Erro: "Grupos precisam de um nome..." |
| 3 | `/conversas/grupo` com nome de 1 caractere | Erro de tamanho |
| 4 | Criar conversa individual com Bruno (Ana já tem) | Redireciona para a conversa existente, com mensagem informativa (não cria duplicada) |

## R7 - Adicionar/Remover do grupo

1. Como Ana, em "Membros" do grupo "Trabalho Backend".
2. Remover Carla → a página recarrega ainda em `/membros` com mensagem de sucesso.
3. Adicionar Carla de volta (via select) → idem, ainda em `/membros`.
4. Voltar à conversa: mensagens permanecem;

## R8 - Excluir grupo

1. Em "Membros", clicar "Excluir grupo".
2. **Esperado:** redirect para `/conversas`, grupo sumiu da lista. As mensagens do grupo também foram apagadas (cascata da classe Conversa).

## R9 - Perfil

1. Como Ana, em `/perfil`, alterar o e-mail para `ana@exemplo.com` → "Salvar alterações".
2. **Esperado:** mensagem de sucesso, dados preservados na recarga.
3. Tentar trocar a senha:
   - Preencher só "Nova senha" sem a atual → erro "Senha atual incorreta".
   - Senha atual certa, nova com 3 caracteres → erro de tamanho.
   - Senha atual certa, nova ≠ confirmação → erro "não coincidem".
   - Senha atual certa, nova = confirmação com 6+ caracteres → sucesso.
4. Sair, logar com a senha nova → funciona.

## R10 - Tratamento de erros

1. Acessar `/qualquer-coisa-inexistente` → página 404 estilizada, botão "Voltar ao início".
2. Acessar `/conversas` sem estar logado → redirect para `/login` com aviso "Faça login para continuar".

## R11 - Logout e sessão

1. Como qualquer usuário, clicar "Sair" → volta para `/login`.
2. Acessar `/conversas` deslogado → redirect para `/login`.