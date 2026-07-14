"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  Command,
  LayoutDashboard,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/layout/command-palette";
import { DocumentIngestDialog } from "@/components/ai/document-ingest-dialog";
import { YlikaMark } from "@/components/layout/ylika-mark";
import { useState } from "react";

const nav = [
  { href: "/workspace", label: "Workspace", icon: LayoutDashboard },
  { href: "/prospectos", label: "Prospectos", icon: Users },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/operaciones", label: "Operaciones", icon: BriefcaseBusiness },
  { href: "/insights", label: "Insights", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [ingestOpen, setIngestOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4 sm:px-6">
          <Link href="/workspace" className="flex items-center gap-2.5 shrink-0">
            <YlikaMark className="size-7" />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-foreground">
              YLIKA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-ylika-teal-soft text-ylika-teal font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex gap-2 text-muted-foreground"
              onClick={() => setCmdOpen(true)}
            >
              <Search className="size-3.5" />
              Buscar
              <kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                ⌘K
              </kbd>
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-ylika-teal hover:bg-ylika-teal/90"
              onClick={() => setIngestOpen(true)}
            >
              <Sparkles className="size-3.5" />
              Ingestar IA
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="sm:hidden"
              onClick={() => setCmdOpen(true)}
            >
              <Command className="size-4" />
            </Button>
            <div className="ml-1 flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-ylika-teal to-teal-700 text-xs font-semibold text-white">
              AR
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <DocumentIngestDialog open={ingestOpen} onOpenChange={setIngestOpen} />
    </div>
  );
}
