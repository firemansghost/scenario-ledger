import { cookies } from "next/headers";
import { Dashboard } from "@/components/dashboard";

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ share?: string }>;
}) {
  const params = await searchParams;
  const shareMode = params?.share === "1";
  const cookieStore = await cookies();
  const nerdMode = cookieStore.get("scenarioledger_nerd")?.value === "1";
  return <Dashboard shareMode={shareMode} nerdMode={nerdMode} />;
}
