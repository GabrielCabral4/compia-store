/**
 * Popula o banco com o catálogo inicial, os usuários de demonstração e alguns
 * pedidos de exemplo — para que o painel administrativo já tenha o que mostrar.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { CATEGORIES, PRODUCTS, TAGS } from "./catalog";
import { buildCoverSvg, buildSimplePdf } from "./assets";
import { hashPassword, randomToken } from "../src/lib/crypto";
import { DEFAULT_SETTINGS } from "../src/lib/settings-defaults";
import { generateOrderNumber } from "../src/lib/order-number";
import { buildPixPayload } from "../src/lib/pix";

const prisma = new PrismaClient();

const ROOT = path.join(process.cwd());
const COVERS_DIR = path.join(ROOT, "public", "covers");
const EBOOKS_DIR = path.join(ROOT, "storage", "ebooks");

const DEMO_PASSWORD = "compia123";

async function reset() {
  // Ordem inversa às dependências de chave estrangeira.
  await prisma.downloadGrant.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.kitItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.address.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();
}

async function seedSettings() {
  await prisma.setting.createMany({
    data: Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  });
}

async function seedUsers() {
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const [admin, editor, vendedor, maria, joao] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Ana Administradora",
        email: "admin@compia.com.br",
        passwordHash,
        role: "ADMIN",
        phone: "(83) 99999-0001",
      },
    }),
    prisma.user.create({
      data: {
        name: "Eduardo Editor",
        email: "editor@compia.com.br",
        passwordHash,
        role: "EDITOR",
        phone: "(83) 99999-0002",
      },
    }),
    prisma.user.create({
      data: {
        name: "Vera Vendedora",
        email: "vendedor@compia.com.br",
        passwordHash,
        role: "VENDEDOR",
        phone: "(83) 99999-0003",
      },
    }),
    prisma.user.create({
      data: {
        name: "Maria Souza",
        email: "cliente@compia.com.br",
        passwordHash,
        role: "CLIENTE",
        cpf: "12345678909",
        phone: "(83) 98888-1234",
        addresses: {
          create: {
            label: "Casa",
            recipient: "Maria Souza",
            cep: "58429900",
            street: "Rua Aprígio Veloso",
            number: "882",
            complement: "Apto 201",
            district: "Universitário",
            city: "Campina Grande",
            state: "PB",
            isDefault: true,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: "João Pereira",
        email: "joao@exemplo.com.br",
        passwordHash,
        role: "CLIENTE",
        cpf: "98765432100",
        phone: "(11) 97777-4321",
        addresses: {
          create: {
            label: "Trabalho",
            recipient: "João Pereira",
            cep: "01310100",
            street: "Avenida Paulista",
            number: "1578",
            district: "Bela Vista",
            city: "São Paulo",
            state: "SP",
            isDefault: true,
          },
        },
      },
    }),
  ]);

  return { admin, editor, vendedor, maria, joao };
}

async function seedCatalog() {
  await mkdir(COVERS_DIR, { recursive: true });
  await mkdir(EBOOKS_DIR, { recursive: true });

  const categories = new Map<string, string>();
  for (const [index, category] of CATEGORIES.entries()) {
    const created = await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        position: index,
      },
    });
    categories.set(category.slug, created.id);
  }

  const tags = new Map<string, string>();
  for (const tag of TAGS) {
    const created = await prisma.tag.create({
      data: {
        slug: tag,
        name: tag
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
      },
    });
    tags.set(tag, created.id);
  }

  const productIdBySku = new Map<string, string>();

  for (const item of PRODUCTS) {
    const category = CATEGORIES.find((c) => c.slug === item.categorySlug)!;

    // Capa em SVG, gerada a partir dos dados do próprio título.
    const coverFile = `${item.slug}.svg`;
    await writeFile(
      path.join(COVERS_DIR, coverFile),
      buildCoverSvg({
        title: item.title,
        subtitle: item.subtitle,
        author: item.author,
        category: category.name,
        accent: category.accent,
        badge:
          item.type === "DIGITAL"
            ? "E-book"
            : item.type === "KIT"
              ? "Kit"
              : undefined,
      }),
      "utf8"
    );

    // Arquivo entregue nos e-books.
    if (item.type === "DIGITAL" && item.digitalFileName) {
      await writeFile(
        path.join(EBOOKS_DIR, item.digitalFileName),
        buildSimplePdf(item.title, [
          `${item.subtitle} — COMPIA Editora`,
          item.author ? `Autoria: ${item.author}` : "COMPIA Editora",
          "",
          item.description,
          "",
          "Este arquivo e uma amostra gerada automaticamente para demonstrar a entrega digital da loja: o download so e liberado por meio de um link com token unico, vinculado ao pedido pago.",
          "",
          "(c) COMPIA Editora - Todos os direitos reservados.",
        ]),
      );
    }

    const created = await prisma.product.create({
      data: {
        sku: item.sku,
        slug: item.slug,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        type: item.type,
        priceCents: item.priceCents,
        compareAtCents: item.compareAtCents ?? null,
        stock: item.stock,
        weightGrams: item.weightGrams,
        taxRateBasisPoints:
          item.taxRateBasisPoints ?? DEFAULT_SETTINGS.defaultTaxBasisPoints,
        author: item.author ?? null,
        isbn: item.isbn ?? null,
        pages: item.pages ?? null,
        edition: item.edition ?? null,
        year: item.year ?? null,
        digitalFileName: item.digitalFileName ?? null,
        digitalFileUrl: item.digitalFileName
          ? `storage/ebooks/${item.digitalFileName}`
          : null,
        featured: item.featured ?? false,
        categoryId: categories.get(item.categorySlug)!,
        tags: {
          connect: item.tags
            .filter((tag) => tags.has(tag))
            .map((tag) => ({ id: tags.get(tag)! })),
        },
        images: {
          create: {
            url: `/covers/${coverFile}`,
            alt: `Capa do livro ${item.title}`,
            position: 0,
          },
        },
      },
    });

    productIdBySku.set(item.sku, created.id);
  }

  // Composição dos kits, depois que todos os produtos existem.
  for (const item of PRODUCTS) {
    if (!item.kitOf) continue;
    for (const sku of item.kitOf) {
      await prisma.kitItem.create({
        data: {
          kitId: productIdBySku.get(item.sku)!,
          productId: productIdBySku.get(sku)!,
          quantity: 1,
        },
      });
    }
  }

  return productIdBySku;
}

type SeededUsers = Awaited<ReturnType<typeof seedUsers>>;

async function seedOrders(
  users: SeededUsers,
  productIdBySku: Map<string, string>
) {
  const products = await prisma.product.findMany();
  const bySku = new Map(products.map((product) => [product.sku, product]));
  const daysAgo = (days: number) =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // 1) Pedido físico já enviado (Maria, SEDEX)
  {
    const book = bySku.get("COMPIA-002")!;
    const other = bySku.get("COMPIA-012")!;
    const subtotal = book.priceCents + other.priceCents;
    const tax = Math.round((subtotal * DEFAULT_SETTINGS.defaultTaxBasisPoints) / 10000);
    const shipping = 3420;
    const createdAt = daysAgo(9);

    await prisma.order.create({
      data: {
        number: generateOrderNumber(createdAt),
        userId: users.maria.id,
        customerName: users.maria.name,
        customerEmail: users.maria.email,
        customerCpf: users.maria.cpf,
        customerPhone: users.maria.phone,
        status: "ENVIADO",
        subtotalCents: subtotal,
        shippingCents: shipping,
        taxCents: tax,
        totalCents: subtotal + shipping + tax,
        shippingMethod: "SEDEX",
        shippingCarrier: "Correios",
        shippingEtaDays: 2,
        trackingCode: "BR123456789BR",
        shipCep: "58429900",
        shipStreet: "Rua Aprígio Veloso",
        shipNumber: "882",
        shipComplement: "Apto 201",
        shipDistrict: "Universitário",
        shipCity: "Campina Grande",
        shipState: "PB",
        createdAt,
        paidAt: daysAgo(8),
        shippedAt: daysAgo(6),
        items: {
          create: [book, other].map((product) => ({
            productId: product.id,
            titleSnapshot: product.title,
            skuSnapshot: product.sku,
            typeSnapshot: product.type,
            unitCents: product.priceCents,
            quantity: 1,
            taxCents: Math.round(
              (product.priceCents * DEFAULT_SETTINGS.defaultTaxBasisPoints) / 10000
            ),
          })),
        },
        payment: {
          create: {
            method: "CARTAO_CREDITO",
            status: "APROVADO",
            amountCents: subtotal + shipping + tax,
            providerRef: "AUTH-8F31KD",
            cardBrand: "VISA",
            cardLast4: "4242",
            cardHolder: "MARIA SOUZA",
            installments: 3,
            paidAt: daysAgo(8),
          },
        },
      },
    });
  }

  // 2) Pedido digital entregue, com download liberado (João)
  {
    const ebook = bySku.get("COMPIA-005")!;
    const magazine = bySku.get("COMPIA-013")!;
    const subtotal = ebook.priceCents + magazine.priceCents;
    const createdAt = daysAgo(3);

    const order = await prisma.order.create({
      data: {
        number: generateOrderNumber(createdAt),
        userId: users.joao.id,
        customerName: users.joao.name,
        customerEmail: users.joao.email,
        customerCpf: users.joao.cpf,
        status: "ENTREGUE",
        subtotalCents: subtotal,
        shippingCents: 0,
        taxCents: 0,
        totalCents: subtotal,
        shippingMethod: "DIGITAL",
        shippingEtaDays: 0,
        createdAt,
        paidAt: daysAgo(3),
        items: {
          create: [ebook, magazine].map((product) => ({
            productId: product.id,
            titleSnapshot: product.title,
            skuSnapshot: product.sku,
            typeSnapshot: product.type,
            unitCents: product.priceCents,
            quantity: 1,
          })),
        },
        payment: {
          create: {
            method: "PIX",
            status: "APROVADO",
            amountCents: subtotal,
            providerRef: "PIX-7712AA",
            pixKey: DEFAULT_SETTINGS.pixKey,
            paidAt: daysAgo(3),
          },
        },
      },
    });

    const expiresAt = new Date(
      Date.now() + DEFAULT_SETTINGS.downloadExpiryDays * 24 * 60 * 60 * 1000
    );
    await prisma.downloadGrant.createMany({
      data: [ebook, magazine].map((product) => ({
        token: randomToken(24),
        orderId: order.id,
        productId: product.id,
        userId: users.joao.id,
        maxDownloads: DEFAULT_SETTINGS.downloadMaxPerItem,
        expiresAt,
      })),
    });
  }

  // 3) Pedido aguardando pagamento por PIX (retirada no local)
  {
    const kit = bySku.get("COMPIA-KIT-01")!;
    const subtotal = kit.priceCents;
    const tax = Math.round((subtotal * DEFAULT_SETTINGS.defaultTaxBasisPoints) / 10000);
    const total = subtotal + tax;
    const createdAt = daysAgo(0);
    const number = generateOrderNumber(createdAt);

    await prisma.order.create({
      data: {
        number,
        userId: users.maria.id,
        customerName: users.maria.name,
        customerEmail: users.maria.email,
        customerCpf: users.maria.cpf,
        status: "PENDENTE_PAGAMENTO",
        subtotalCents: subtotal,
        shippingCents: 0,
        taxCents: tax,
        totalCents: total,
        shippingMethod: "RETIRADA_LOCAL",
        shippingCarrier: "COMPIA",
        shippingEtaDays: 1,
        createdAt,
        items: {
          create: {
            productId: kit.id,
            titleSnapshot: kit.title,
            skuSnapshot: kit.sku,
            typeSnapshot: kit.type,
            unitCents: kit.priceCents,
            quantity: 1,
            taxCents: tax,
          },
        },
        payment: {
          create: {
            method: "PIX",
            status: "AGUARDANDO",
            amountCents: total,
            pixKey: DEFAULT_SETTINGS.pixKey,
            pixTxid: number.replace(/[^A-Za-z0-9]/g, "").slice(0, 25),
            pixPayload: buildPixPayload({
              key: DEFAULT_SETTINGS.pixKey,
              merchantName: DEFAULT_SETTINGS.pixMerchantName,
              merchantCity: DEFAULT_SETTINGS.pixMerchantCity,
              amountCents: total,
              txid: number,
              description: `Pedido ${number}`,
            }),
            pixExpiresAt: new Date(
              Date.now() + DEFAULT_SETTINGS.pixExpiryMinutes * 60 * 1000
            ),
          },
        },
      },
    });
  }

  void productIdBySku;
}

async function seedLogs(users: SeededUsers) {
  await prisma.activityLog.createMany({
    data: [
      {
        userId: users.admin.id,
        actorEmail: users.admin.email,
        action: "SEED",
        entity: "System",
        detail: "Base de demonstração criada.",
      },
      {
        userId: users.editor.id,
        actorEmail: users.editor.email,
        action: "PRODUTO_CRIADO",
        entity: "Product",
        detail: "Catálogo inicial publicado (15 títulos).",
      },
    ],
  });
}

async function main() {
  console.info("→ limpando base…");
  await reset();

  console.info("→ configurações da loja…");
  await seedSettings();

  console.info("→ usuários e perfis…");
  const users = await seedUsers();

  console.info("→ catálogo, capas e e-books…");
  const productIdBySku = await seedCatalog();

  console.info("→ pedidos de exemplo…");
  await seedOrders(users, productIdBySku);

  await seedLogs(users);

  console.info(`
✔ Seed concluído.

  Acessos de demonstração (senha: ${DEMO_PASSWORD})
    Administrador  admin@compia.com.br
    Editor         editor@compia.com.br
    Vendedor       vendedor@compia.com.br
    Cliente        cliente@compia.com.br
    Cliente        joao@exemplo.com.br
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
