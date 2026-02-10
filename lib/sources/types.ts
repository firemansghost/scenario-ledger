import type { DailyDataPoint } from "@/lib/types";

export type FetcherResult = { data: DailyDataPoint[]; error?: string };
