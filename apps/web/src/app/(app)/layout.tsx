import { AppShell } from "@/components/layout/app-shell";
import { YlikaStoreProvider } from "@/lib/store";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <YlikaStoreProvider>
      <AppShell>{children}</AppShell>
    </YlikaStoreProvider>
  );
}
