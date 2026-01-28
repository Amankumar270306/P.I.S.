import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { FocusProvider } from "@/context/FocusContext";
import { FocusOverlay } from "@/components/focus/FocusOverlay";
import { UIProvider } from "@/context/UIContext";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "P.I.S. - Personal Intelligence Scheduler",
  description: "Manage your energy, not just your time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FocusProvider>
          <UIProvider>
            <FocusOverlay />
            <AddTaskModal />
            <AppShell>{children}</AppShell>
          </UIProvider>
        </FocusProvider>
      </body>
    </html>
  );
}
