import { getCollectors, getTodaysFloors } from "../actions";

export const dynamic = "force-dynamic";

// Collector picks their name, then taps a floor to mark it collected (calls checkIn).
export default async function CheckinPage() {
  const [collectors, floors] = await Promise.all([getCollectors(), getTodaysFloors()]);

  // TODO(frontend): name picker, one large button per floor, confirmation with undo.
  return (
    <main>
      <h1>Collector check-in</h1>
      <p>
        {collectors.length} collectors, {floors.length} floors scheduled today
      </p>
    </main>
  );
}
