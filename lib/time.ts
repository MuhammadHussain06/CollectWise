// The pilot runs on Malaysian time, while Vercel and Supabase run in UTC.
export function todayInMalaysia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(new Date());
}
