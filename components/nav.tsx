import Link from "next/link";

export function Nav() {
  return (
    <nav className="mt-4 flex gap-4 text-sm">
      <Link href="/" className="text-muted-foreground hover:text-foreground">
        Dashboard
      </Link>
      <Link href="/evidence" className="text-muted-foreground hover:text-foreground">
        Evidence
      </Link>
      <Link href="/alignment" className="text-muted-foreground hover:text-foreground">
        Alignment
      </Link>
      <Link href="/forecasts" className="text-muted-foreground hover:text-foreground">
        Forecasts
      </Link>
      <Link href="/admin" className="text-muted-foreground hover:text-foreground">
        Admin
      </Link>
    </nav>
  );
}
