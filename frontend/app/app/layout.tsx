import { SideQuestProvider } from "@/contexts/sidequest-context";
import { AppShell } from "./app-shell";

export default function AppGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SideQuestProvider>
        <AppShell>{children}</AppShell>
      </SideQuestProvider>
    </div>
  );
}
