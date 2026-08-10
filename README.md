# COMPIA Editora | Loja Virtual

Plataforma de e-commerce da COMPIA Editora, editora de materiais bibliográficos
da área de Inteligência Artificial.

Projeto da disciplina de Programação para Web, UFCG / CEEI / Unidade Acadêmica
de Sistemas e Computação.

**Equipe**

| Aluno | Matrícula |
| --- | --- |
| Gabriel Cabral de Medeiros | 122210158 |
| Vitor Schuler Borges Veloso | 123110668 |
| Axel Vaz Souto Lima | 122210109 |

**Loja publicada:** <https://compia-store-mu.vercel.app>
**Acesso ao painel:** `admin@compia.com.br` / `compia123`

A loja vende livros físicos, e-books e kits; aceita PIX (QR Code com chave
aleatória) e cartão de crédito das principais bandeiras; calcula frete e
impostos; oferece Correios, transportadora, retirada no local e entrega digital
automática; e traz um painel administrativo que permite operar a loja inteira,
inclusive criar produtos e categorias, sem escrever código.

---

## Sumário

- [Como rodar](#como-rodar)
- [Acessos de demonstração](#acessos-de-demonstração)
- [Como testar cada requisito](#como-testar-cada-requisito)
- [Requisitos e implementação](#requisitos-e-implementação)
- [Arquitetura](#arquitetura)
- [Modelo de dados](#modelo-de-dados)
- [Regras de negócio](#regras-de-negócio)
- [Segurança](#segurança)
- [Testes](#testes)
- [Implantação (Vercel)](#implantação-vercel)
- [Decisão sobre a plataforma](#decisão-sobre-a-plataforma)

---

## Como rodar

Pré-requisito: Node.js 20.9 ou superior. Nada além disso, porque o banco de
desenvolvimento é SQLite e não precisa de instalação.

```bash
cd compia-store
cp .env.example .env      # no Windows: copy .env.example .env
npm install
npm run db:sqlite         # aponta o schema para SQLite
npm run setup             # cria o banco, gera o cliente Prisma e popula os dados
npm run dev               # http://localhost:3000
```

O schema versionado fica em PostgreSQL, que é o banco usado na Vercel. Os
scripts `npm run db:sqlite` e `npm run db:postgres` alternam entre os dois, e
nenhum modelo precisa mudar por causa disso.

Scripts disponíveis:

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe a loja em modo de desenvolvimento |
| `npm run build` / `npm start` | Compilação e execução em modo de produção |
| `npm run setup` | Aplica as migrações e popula o banco de demonstração |
| `npm run db:seed` | Repopula o banco (apaga e recria os dados de exemplo) |
| `npm run db:reset` | Recria o banco do zero e popula novamente |
| `npm run db:studio` | Abre o Prisma Studio para inspecionar o banco |
| `npm test` | Executa os testes automatizados |
| `npm run lint` / `npm run typecheck` | Análise estática e verificação de tipos |

O `seed` gera também as capas dos livros (SVG, em `public/covers/`) e os
arquivos dos e-books (PDF, em `storage/ebooks/`), de modo que o fluxo de
download funciona de ponta a ponta sem depender de nenhum arquivo externo.

---

## Acessos de demonstração

Senha de todos: `compia123`

| Perfil | E-mail | Pode |
| --- | --- | --- |
| Administrador | `admin@compia.com.br` | tudo: catálogo, pedidos, usuários, configurações e logs |
| Editor | `editor@compia.com.br` | somente catálogo (produtos, categorias, etiquetas) |
| Vendedor | `vendedor@compia.com.br` | somente pedidos, clientes e envios |
| Cliente | `cliente@compia.com.br` | comprar e acessar a própria área |
| Cliente | `joao@exemplo.com.br` | cliente com e-books já comprados |

### Cartões de teste (gateway em sandbox)

| Número | Resultado |
| --- | --- |
| `4111 1111 1111 1111` | aprovado (Visa) |
| `6362 9700 0045 7013` | aprovado (Elo) |
| `4000 0000 0000 0002` | recusado pelo emissor |
| `5555 5555 5555 0004` | recusado por limite |

Use qualquer validade futura e CVV de 3 dígitos (4 para Amex).

No caso do PIX, o pedido nasce aguardando pagamento e exibe o QR Code. O botão
"Simular confirmação do PIX" na página do pedido representa o webhook que o
banco enviaria em produção.

---

## Como testar cada requisito

Roteiro curto para avaliar a aplicação:

1. **Catálogo e filtros.** Em `/produtos`, filtre por categoria, formato
   (livro/e-book/kit), etiqueta e faixa de preço; busque por título, autor ou
   ISBN.
2. **Frete automático.** Na página de um livro, informe um CEP (por exemplo,
   `01310-100`) e veja PAC, SEDEX e retirada com preço e prazo calculados.
3. **Compra com cartão.** Adicione um livro físico e um e-book ao carrinho,
   faça login como cliente e finalize com `4000 0000 0000 0002` (recusa, para
   ver o tratamento de erro) e depois com `4111 1111 1111 1111` (aprovação).
4. **Entrega digital.** Na mesma tela do pedido aprovado, baixe o e-book. Ele
   também aparece em Minha biblioteca.
5. **Compra com PIX.** Repita com PIX, confira o QR Code e o "copia e cola" e
   use o botão de simulação para confirmar o pagamento.
6. **Gestão de pedidos.** Entre como vendedor ou administrador, abra o pedido
   em `/admin/pedidos`, mude a situação e informe o código de rastreio: o
   cliente é notificado por e-mail (visível em `/admin/emails`).
7. **Escalabilidade sem programação.** Como editor, cadastre um produto novo em
   `/admin/produtos/novo` (a capa é gerada automaticamente) e crie uma categoria
   em `/admin/categorias`. Ambos aparecem na loja imediatamente.
8. **Controle de acesso.** Logado como editor, tente abrir `/admin/usuarios`: o
   acesso é bloqueado. Toda ação relevante fica registrada em `/admin/logs`.
9. **Responsividade.** Reduza a janela para largura de celular: cabeçalho,
   catálogo, checkout e painel se adaptam.

---

## Requisitos e implementação

| Requisito da especificação | Onde está |
| --- | --- |
| Cadastro, edição e exclusão de produtos (livros, e-books, kits) | `/admin/produtos`, `/admin/produtos/novo`. A exclusão vira desativação quando o título já tem vendas, preservando o histórico |
| Organização por categorias, tags e filtros | `/admin/categorias` e filtros em `/produtos` |
| Imagens, descrições, preços e estoque | formulário de produto; capa gerada automaticamente quando nenhuma imagem é informada |
| Adição e remoção de produtos do carrinho | `/carrinho` (carrinho em cookie assinado, funciona sem login) |
| Cálculo automático de frete e impostos | `src/lib/shipping.ts` e alíquota por produto/loja; o resumo do pedido detalha os dois |
| Checkout simples e responsivo | `/checkout`, com dados, entrega e pagamento em uma página |
| Integração com gateway de pagamento | `src/lib/gateway.ts`: interface `PaymentGateway` com implementação sandbox. Trocar por PagSeguro/Mercado Pago/Stripe não afeta as telas |
| Principais bandeiras (Visa, MasterCard, Elo) | `src/lib/cards.ts`: detecção de bandeira, Luhn, validade, CVV e parcelamento |
| PIX com QR Code e chave aleatória | `src/lib/pix.ts`: BR Code no padrão EMV do Banco Central, com CRC16 e chave aleatória configurável |
| Painel administrativo para pedidos | `/admin/pedidos`, com filtros por situação e forma de entrega |
| Notificações automáticas por e-mail | `src/lib/mail.ts`: SMTP quando configurado, sempre registrado em `/admin/emails` |
| Área do cliente com histórico | `/conta`, `/conta/pedidos`, `/conta/enderecos`, `/conta/dados` |
| Integração com Correios/transportadoras | cotação PAC, SEDEX e transportadora por região de CEP (`/api/frete`), pronta para trocar pela API real |
| Retirada no local | opção de entrega configurável em `/admin/configuracoes` |
| E-books com download automático | `DownloadGrant` mais `/api/download/[token]`, com limite de downloads e validade |
| Painel amigável com menus claros | `src/app/admin`: navegação por seções e formulários rotulados em português |
| Controle de acesso por perfis | `src/lib/auth.ts`: matriz de permissões por perfil |
| Registro de logs de atividade | `src/lib/logs.ts` e `/admin/logs` |
| Layout responsivo | Tailwind CSS, verificado de 390 px a 1440 px |
| Escalabilidade sem programação | produtos, categorias, etiquetas, frete, impostos, PIX e regras de download são todos editáveis pelo painel |

---

## Arquitetura

```
compia-store/
├── prisma/
│   ├── schema.prisma        modelo de dados
│   ├── catalog.ts           catálogo inicial (dados do seed)
│   ├── assets.ts            geração dos PDFs de demonstração
│   └── seed.ts              carga inicial do banco
├── src/
│   ├── app/
│   │   ├── (loja)/          site público: home, catálogo, carrinho,
│   │   │                    checkout, pedido, conta do cliente
│   │   ├── admin/           painel administrativo
│   │   └── api/             frete, consulta de CEP e download de e-books
│   ├── actions/             Server Actions (carrinho, autenticação,
│   │                        checkout e administração)
│   ├── components/          componentes de interface
│   └── lib/                 regras de negócio isoladas da interface
├── tests/                   testes automatizados do domínio
└── storage/ebooks/          arquivos entregues aos compradores
```

Stack: Next.js 16 (App Router, Server Components e Server Actions), React 19,
TypeScript, Tailwind CSS 4, Prisma ORM e SQLite (PostgreSQL em produção).

Decisões que valem registrar:

- Regras de negócio ficam em `src/lib`, não nos componentes. Frete, impostos,
  PIX, cartões e permissões são funções puras testáveis, e a interface apenas
  as consome.
- Dinheiro circula sempre em centavos (`Int`), nunca em ponto flutuante.
- O cliente nunca decide valores. Preço, frete e impostos são recalculados no
  servidor ao criar o pedido; o carrinho guarda apenas identificador e
  quantidade.
- O gateway de pagamento é uma interface. A implementação sandbox pode ser
  trocada por um provedor real sem alterar telas nem ações.

---

## Modelo de dados

Principais entidades (`prisma/schema.prisma`):

- **User / Session / Address:** contas, sessões no servidor e endereços de
  entrega. O perfil (`role`) define as permissões.
- **Category / Tag / Product / ProductImage / KitItem:** catálogo. `KitItem`
  descreve a composição dos kits.
- **Order / OrderItem / Payment:** pedidos. Os itens guardam uma cópia de
  título, código e preço no momento da compra, de modo que alterações futuras
  no catálogo não reescrevem o histórico.
- **DownloadGrant:** autorização de download de um e-book, com token, limite de
  downloads e validade.
- **Setting:** configurações da loja editáveis pelo painel.
- **ActivityLog / EmailLog:** auditoria e notificações.

Os campos que seriam `enum` estão como `String` porque o SQLite não suporta
enums no Prisma. Os valores válidos ficam centralizados em
`src/lib/constants.ts`.

---

## Regras de negócio

**Frete.** A origem é Campina Grande/PB. O custo combina taxa base, peso do
pedido e um multiplicador por região de destino, derivado do primeiro dígito do
CEP, que é como os Correios dividem o território. SEDEX custa 1,8 vez o PAC com
metade do prazo; transportadora só aparece acima de 3 kg; retirada no local e
pedidos exclusivamente digitais não têm frete. Todos os parâmetros vêm das
configurações da loja.

**Impostos.** Cada produto pode ter alíquota própria (em pontos base). Sem
alíquota definida, vale a alíquota padrão da loja. O valor é calculado item a
item e destacado no resumo do pedido.

**Estoque.** É reservado na criação do pedido, dentro da mesma transação que o
grava, então dois pedidos simultâneos não conseguem levar a mesma última
unidade. Cancelar um pedido devolve as unidades.

**Pagamento.** Cartão é autorizado antes de o pedido ser gravado; recusa não
cria pedido nem baixa estoque. PIX gera o BR Code e o pedido aguarda a
confirmação.

**Entrega digital.** Assim que o pagamento é aprovado, cada e-book do pedido
ganha um `DownloadGrant` com token único. O arquivo fica fora de `public/`, de
modo que só é acessível pelo link autorizado.

---

## Segurança

- Senhas com scrypt e salt por usuário (`src/lib/crypto.ts`), com comparação em
  tempo constante.
- Sessões no servidor, com token opaco em cookie `httpOnly`, `SameSite=Lax` e
  `Secure` em produção. Desativar um usuário encerra suas sessões.
- Carrinho em cookie assinado com HMAC-SHA256: adulterar o conteúdo invalida o
  cookie e, ainda assim, preços são sempre relidos do banco.
- Permissões por perfil verificadas dentro de cada Server Action, não apenas na
  navegação.
- Pedidos vinculados a uma conta só podem ser vistos pelo dono ou pela equipe;
  pedidos de visitante usam número com sufixo aleatório.
- Downloads limitados por token, quantidade e validade, com cada acesso
  registrado no log.
- Log de atividade para login, alterações de catálogo, mudanças de pedido,
  pagamentos e downloads.

---

## Testes

```bash
npm test        # 27 testes de domínio
npm run lint    # ESLint
npm run typecheck
```

Os testes cobrem o gerador de BR Code do PIX (inclusive comparando o CRC-16 com
o valor de referência do algoritmo), validação de cartões e parcelamento, o
cálculo de frete em todas as combinações de região/peso/retirada, conversão
monetária, validação de CPF, hash de senha e integridade do carrinho assinado.

Além disso, o fluxo completo, do catálogo ao download do e-book, passando por
recusa de cartão, PIX, painel administrativo e bloqueio por perfil, foi
verificado no navegador durante o desenvolvimento.

---

## Implantação (Vercel)

1. Crie um banco PostgreSQL (Vercel Postgres, Neon, Supabase).
2. Em `prisma/schema.prisma`, troque o `provider` do datasource para
   `postgresql`. O script `npm run db:postgres` faz isso.
3. Configure as variáveis de ambiente no projeto da Vercel: `DATABASE_URL`,
   `APP_SECRET`, `NEXT_PUBLIC_SITE_URL` e, opcionalmente, as de SMTP.
4. Faça o deploy. O `build` já executa `prisma generate`; rode
   `npx prisma migrate deploy` contra o banco de produção.

Observação sobre os e-books: o sistema de arquivos das funções serverless é
somente leitura, então em produção os PDFs devem ficar em armazenamento externo
(Vercel Blob, S3). A rota de download já trata os dois casos: se
`digitalFileUrl` for uma URL `http(s)`, ela redireciona para lá; se for um
caminho local, lê o arquivo do disco.

---

## Decisão sobre a plataforma

A especificação recomenda WordPress com WooCommerce e, ao mesmo tempo, indica
hospedagem na Vercel, que executa Node.js e não PHP/MySQL, ou seja, não roda
WordPress. Optamos por atender à hospedagem indicada e construir a plataforma
em Next.js, o que preserva todos os requisitos funcionais e ainda traz uma
vantagem para a avaliação: o código das regras de negócio (frete, PIX, impostos,
permissões) fica explícito e testável, em vez de escondido atrás da
configuração de plugins.

O requisito que motiva a escolha do WooCommerce, "suporte a novos produtos e
categorias sem necessidade de programação", é atendido pelo painel
administrativo: produtos, categorias, etiquetas, preços, estoque, frete,
impostos, chave PIX, retirada e regras de download são todos editáveis pela
interface, por pessoas sem conhecimento técnico.
