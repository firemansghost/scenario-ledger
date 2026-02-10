import { createClient } from "@/lib/supabaseClient";
import { CreateForecastForm } from "@/components/create-forecast-form";

export const dynamic = "force-dynamic";

export default async function NewForecastPage() {
  const supabase = createClient();
  const { data: latest } = await supabase
    .from("forecasts")
    .select("id, version, config")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version ?? 0) + 1;
  const defaultConfig = latest?.config ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Create forecast v{nextVersion}</h1>
      <p className="text-sm text-zinc-400">
        Copy of previous version config. Edit JSON and submit to create a new immutable version.
      </p>
      <CreateForecastForm nextVersion={nextVersion} defaultConfig={defaultConfig} />
    </div>
  );
}
