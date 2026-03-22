import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { AppShell } from "@/shared/components/AppShell";
import { FocusProvider } from "@/providers/FocusContext";
import { FocusOverlay } from "@/features/focus/components/FocusOverlay";
import { UIProvider } from "@/providers/UIContext";
import { AddTaskModal } from "@/features/tasks/components/AddTaskModal";
import Providers from "./providers";

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
        <Providers>
          <FocusProvider>
            <UIProvider>
              <FocusOverlay />
              <AddTaskModal />
              <AppShell>{children}</AppShell>
            </UIProvider>
          </FocusProvider>
        </Providers>
      </body>
    </html>
  );
}
