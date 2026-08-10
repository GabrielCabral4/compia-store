import "server-only";
import { prisma } from "./prisma";
import { DEFAULT_SETTINGS, type StoreSettings } from "./settings-defaults";

export { DEFAULT_SETTINGS };
export type { StoreSettings };

type SettingKey = keyof StoreSettings;

function coerce<K extends SettingKey>(
  key: K,
  raw: string
): StoreSettings[K] | undefined {
  const fallback = DEFAULT_SETTINGS[key];
  if (typeof fallback === "number") {
    const parsed = Number(raw);
    return (Number.isFinite(parsed) ? parsed : undefined) as
      | StoreSettings[K]
      | undefined;
  }
  if (typeof fallback === "boolean") {
    return (raw === "true") as StoreSettings[K];
  }
  return raw as StoreSettings[K];
}

/**
 * Configurações da loja, com os valores do banco sobrepostos aos padrões.
 * São editáveis em /admin/configuracoes, de modo que regras de negócio
 * (frete grátis, imposto, chave PIX, retirada) mudam sem alterar código.
 */
export async function getSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany();
  const settings: StoreSettings = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    if (!(row.key in DEFAULT_SETTINGS)) continue;
    const key = row.key as SettingKey;
    const value = coerce(key, row.value);
    if (value !== undefined) {
      (settings as Record<string, unknown>)[key] = value;
    }
  }

  return settings;
}

export async function saveSettings(
  partial: Partial<StoreSettings>
): Promise<void> {
  const entries = Object.entries(partial).filter(
    ([key]) => key in DEFAULT_SETTINGS
  );

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
  );
}
