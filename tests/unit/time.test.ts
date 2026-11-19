import { afterEach, describe, expect, it, vi } from "vitest";
import { todayInMalaysia } from "@/lib/time";

describe("todayInMalaysia", () => {
  afterEach(() => vi.useRealTimers());

  it("is still the same day before 4pm UTC", () => {
    vi.useFakeTimers({ now: new Date("2026-12-07T15:59:00Z") });
    expect(todayInMalaysia()).toBe("2026-12-07");
  });

  it("rolls over to the next day at 4pm UTC (midnight in Malaysia)", () => {
    vi.useFakeTimers({ now: new Date("2026-12-07T16:00:00Z") });
    expect(todayInMalaysia()).toBe("2026-12-08");
  });
});
