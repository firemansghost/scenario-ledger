import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "ScenarioLedger",
  description: "Frozen forecasts. Weekly receipts.",
};

function NavFallback() {
  return (
    <nav className="mt-4 flex gap-4 text-sm">
      <a href="/" className="text-muted-foreground hover:text-foreground">Dashboard</a>
      <a href="/predictions" className="text-muted-foreground hover:text-foreground">Predictions</a>
      <a href="/evidence" className="text-muted-foreground hover:text-foreground">Evidence</a>
      <a href="/alignment" className="text-muted-foreground hover:text-foreground">Alignment</a>
      <a href="/forecasts" className="text-muted-foreground hover:text-foreground">Forecasts</a>
      <a href="/learn" className="text-muted-foreground hover:text-foreground">Learn</a>
    </nav>
  );
}

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
            <Suspense fallback={<NavFallback />}>
              <Nav />
            </Suspense>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
