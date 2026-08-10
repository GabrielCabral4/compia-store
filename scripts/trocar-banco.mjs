/**
 * Alterna o banco de dados do projeto entre SQLite (desenvolvimento) e
 * PostgreSQL (produção na Vercel).
 *
 *   node scripts/trocar-banco.mjs postgres
 *   node scripts/trocar-banco.mjs sqlite
 *
 * O Prisma não aceita variável de ambiente no campo `provider` do datasource,
 * então a troca precisa ser feita no arquivo do schema; este script faz isso
 * de forma segura, sem depender de edição manual.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SCHEMA = path.join(process.cwd(), "prisma", "schema.prisma");

const TARGETS = {
  sqlite: "sqlite",
  postgres: "postgresql",
  postgresql: "postgresql",
};

const argument = (process.argv[2] ?? "").toLowerCase();
const provider = TARGETS[argument];

if (!provider) {
  console.error(
    "Uso: node scripts/trocar-banco.mjs <sqlite|postgres>\n" +
      "Exemplo: node scripts/trocar-banco.mjs postgres"
  );
  process.exit(1);
}

const schema = await readFile(SCHEMA, "utf8");
const updated = schema.replace(
  /(datasource db \{[^}]*?provider\s*=\s*)"[^"]+"/,
  `$1"${provider}"`
);

if (updated === schema) {
  console.info(`Nada a fazer: o schema já usa "${provider}".`);
} else {
  await writeFile(SCHEMA, updated);
  console.info(`✔ Banco alterado para "${provider}" em prisma/schema.prisma.`);
}

if (provider === "postgresql") {
  console.info(`
Próximos passos para a produção:
  1. Defina DATABASE_URL apontando para o PostgreSQL.
  2. npx prisma db push      (cria as tabelas no banco de produção)
  3. npm run db:seed         (opcional: carrega o catálogo de demonstração)
`);
} else {
  console.info(`
Próximos passos para o desenvolvimento local:
  1. DATABASE_URL="file:./dev.db" no arquivo .env
  2. npm run setup
`);
}
