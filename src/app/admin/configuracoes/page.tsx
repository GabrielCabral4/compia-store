import type { Metadata } from "next";

import { requirePermission } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function AdminSettingsPage() {
  await requirePermission("settings:write");
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Configurações da loja
        </h1>
        <p className="mt-1 text-[14px] text-ink-500">
          Estes parâmetros valem para toda a loja e são aplicados imediatamente.
          Nenhuma alteração de código é necessária.
        </p>
      </header>

      <SettingsForm settings={settings} />
    </div>
  );
}
