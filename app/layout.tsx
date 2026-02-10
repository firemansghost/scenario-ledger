import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "ScenarioLedger",
  description: "Frozen forecasts. Weekly receipts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="container mx-auto px-4 py-6">
          <header className="mb-8">
            <h1 className="text-2xl font-bold">ScenarioLedger</h1>
            <p className="text-muted-foreground">Frozen forecasts. Weekly receipts.</p>
            <Nav />
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
