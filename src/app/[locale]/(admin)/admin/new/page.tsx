import { getTranslations, setRequestLocale } from "next-intl/server";
import { NewTenantForm } from "@/components/admin/new-tenant-form";

export default async function NewTenantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-olive">{t("newTenant")}</h1>
      <NewTenantForm />
    </div>
  );
}
