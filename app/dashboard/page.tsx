import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { DashboardPageContent } from "@/components/dashboard/DashboardPageContent";
import { getSessionUser } from "@/lib/auth/session";
import { getCommandCenterData } from "@/lib/db/repository";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getCommandCenterData(user.organizationId);

  return (
    <AppShell>
      <DashboardPageContent data={data} />
    </AppShell>
  );
}
