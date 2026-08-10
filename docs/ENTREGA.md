# Guia de entrega do projeto

Checklist para entregar a loja da COMPIA Editora conforme a especificação da
disciplina.

---

## 1. O que compõe a entrega

| Item | Situação | Onde |
| --- | --- | --- |
| Código-fonte da plataforma | pronto | este repositório |
| Documentação técnica (arquitetura, regras de negócio, segurança) | pronta | [`README.md`](../README.md) |
| Roteiro de avaliação passo a passo | pronto | seção "Como testar cada requisito" do `README.md` |
| Mapa requisito × implementação | pronto | seção "Requisitos do projeto × implementação" do `README.md` |
| Testes automatizados | 27 testes | `npm test` |
| Loja publicada com HTTPS | **a fazer por você** | seção 3 deste guia |
| Identificação da equipe | pronta | tabela no topo do `README.md` |

---

## 2. Antes de publicar

### 2.1 Identificação da equipe

A especificação não define formato de entrega nem exige identificação em lugar
específico — mas, como ela vem com a capa institucional da UFCG, os nomes da
equipe estão no topo do `README.md`, que é o primeiro arquivo visto ao abrir o
repositório.

Se o professor pedir dados específicos da editora (nome, CNPJ, contato), eles
são editáveis em `/admin/configuracoes`, sem alterar código.

### 2.2 Troque o segredo da aplicação

O `.env` de desenvolvimento usa um segredo de exemplo. Para a versão publicada,
gere um novo:

```bash
openssl rand -base64 32
```

Use o valor como `APP_SECRET` na Vercel (**não** commite o `.env`; ele já está
no `.gitignore`).

### 2.3 Confira que tudo passa

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

---

## 3. Publicar na Vercel (hospedagem recomendada pela especificação)

A especificação indica <https://vercel.com/new> como hospedagem. A Vercel roda
Node.js e não oferece MySQL, então a loja usa **PostgreSQL** em produção — a
troca é automatizada.

### 3.1 Suba o código para o GitHub

```bash
git add -A
git commit -m "Loja virtual da COMPIA Editora"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/compia-store.git
git push -u origin main
```

> O repositório pode ser privado; basta convidar o professor como colaborador.

### 3.2 Crie o banco PostgreSQL

Em <https://vercel.com/new>, importe o repositório. Depois, no painel do
projeto, vá em **Storage → Create Database → Postgres** (ou use um banco
gratuito no [Neon](https://neon.tech) / [Supabase](https://supabase.com)).
Copie a *connection string*.

### 3.3 Configure as variáveis de ambiente na Vercel

Em **Settings → Environment Variables**:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | a connection string do PostgreSQL |
| `APP_SECRET` | o segredo gerado no passo 2.2 |
| `NEXT_PUBLIC_SITE_URL` | `https://seu-projeto.vercel.app` |

As variáveis de SMTP são opcionais — sem elas, os e-mails ficam registrados em
`/admin/emails`, o que já demonstra o requisito de notificação.

### 3.4 Prepare o banco de produção

Rode **da sua máquina**, apontando para o banco de produção:

```bash
npm run db:postgres                      # troca o schema para PostgreSQL
DATABASE_URL="postgresql://..." npm run db:push    # cria as tabelas
DATABASE_URL="postgresql://..." npm run db:seed    # carrega o catálogo de demonstração
```

Depois faça o commit do schema alterado e envie:

```bash
git add prisma/schema.prisma
git commit -m "Configura PostgreSQL para produção"
git push
```

A Vercel refaz o deploy sozinha. O HTTPS já vem habilitado.

### 3.5 Se quiser manter o SQLite para rodar localmente

Duas estratégias, escolha uma:

- **Branch de produção** (recomendada): mantenha `main` com SQLite — assim
  qualquer pessoa roda o projeto com `npm run setup`, sem instalar banco — e
  crie uma branch `producao` com o schema em PostgreSQL, apontando a Vercel para
  ela em *Settings → Git → Production Branch*.

  ```bash
  git checkout -b producao
  npm run db:postgres
  git commit -am "PostgreSQL para produção"
  git push -u origin producao
  git checkout main          # main continua em SQLite
  ```

- **Só PostgreSQL**: mantenha o schema em `postgresql` e informe no README que o
  projeto precisa de uma `DATABASE_URL` PostgreSQL para rodar localmente.

### 3.6 Sobre os arquivos dos e-books

Os PDFs de demonstração ficam em `storage/ebooks/` e são incluídos
automaticamente no pacote enviado à Vercel — o download funciona no site
publicado. Se no futuro a editora subir arquivos grandes, basta gravar uma URL
completa no campo *Caminho ou URL do arquivo* do produto: a rota de download já
redireciona para armazenamento externo (S3, Vercel Blob) nesse caso.

---

## 4. Verificação final na loja publicada

Abra o site publicado e confirme, nesta ordem:

- [ ] Home e catálogo carregam com as capas
- [ ] Filtro por categoria, formato e etiqueta funciona
- [ ] Cálculo de frete responde a um CEP (ex.: `01310-100`)
- [ ] Compra com cartão recusado (`4000 0000 0000 0002`) mostra o erro
- [ ] Compra com cartão aprovado (`4111 1111 1111 1111`) conclui o pedido
- [ ] O e-book comprado é baixado pelo link do pedido
- [ ] Compra com PIX exibe o QR Code e o "copia e cola"
- [ ] Login como `admin@compia.com.br` abre o painel
- [ ] Cadastro de um produto novo pelo painel aparece na loja
- [ ] Login como `editor@compia.com.br` é bloqueado em `/admin/usuarios`
- [ ] `/admin/logs` mostra as ações registradas
- [ ] O site se ajusta bem em tela de celular

---

## 5. O que enviar ao professor

1. **Link do site publicado** (Vercel, com HTTPS).
2. **Link do repositório** no GitHub.
3. **Credenciais de demonstração** — as da tabela do `README.md`; destaque
   `admin@compia.com.br` / `compia123` para ele avaliar o painel.
4. **Um parágrafo de contexto**, sugestão:

   > A plataforma foi construída em Next.js + TypeScript + PostgreSQL e está
   > hospedada na Vercel, conforme a hospedagem recomendada na especificação.
   > Como a Vercel executa Node.js e não PHP/MySQL, o WordPress + WooCommerce
   > não seria executável nessa infraestrutura; a justificativa completa e o
   > mapa de cada requisito da especificação para a implementação estão no
   > README do repositório. Todos os requisitos funcionais foram atendidos,
   > incluindo os itens de pontuação extra: gateway com PIX (QR Code no padrão
   > do Banco Central) e cartões das principais bandeiras, e cálculo de frete
   > por Correios/transportadora com opção de retirada no local.

---

## 6. Itens de pontuação extra da especificação

| Item | Como foi atendido |
| --- | --- |
| Gateway de pagamento com PIX e cartões | `src/lib/gateway.ts` (interface trocável) + `src/lib/pix.ts` (BR Code EMV com CRC-16) + `src/lib/cards.ts` (bandeiras, Luhn, parcelamento) |
| Integração com Correios/transportadoras | `src/lib/shipping.ts` e `/api/frete` — PAC, SEDEX e transportadora com preço e prazo por região de CEP, além de retirada no local |
