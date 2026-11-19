import { getDashboardSummary, getOpenReports, getTodaysFloors } from "../actions";

export const dynamic = "force-dynamic";

// JMB view: today's floor status, the summary counts and open missed-collection reports.
export default async function DashboardPage() {
  // TODO(backend): redirect to a login form unless the dashboard session cookie is valid.
  const [summary, floors, reports] = await Promise.all([
    getDashboardSummary(),
    getTodaysFloors(),
    getOpenReports(),
  ]);

  // TODO(frontend): summary tiles, floor list with check-in times, reports with a Resolve button.
  return (
    <main>
      <h1>JMB dashboard</h1>
      <p>
        {summary ? `${summary.completed_today}/${summary.scheduled_today} floors collected today` : "No data yet"}
      </p>
      <p>
        {floors.length} floors scheduled, {reports.length} open reports
      </p>
    </main>
  );
}
