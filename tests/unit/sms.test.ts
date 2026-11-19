import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizePhone, sendSms } from "@/lib/sms";

describe("normalizePhone", () => {
  it.each([
    ["0123456789", "+60123456789"],
    ["012-345 6789", "+60123456789"],
    ["+60123456789", "+60123456789"],
    ["60123456789", "+60123456789"],
    ["+60 12-345 6789", "+60123456789"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe("sendSms", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TEXTBEE_API_KEY", "test-key");
    vi.stubEnv("TEXTBEE_DEVICE_ID", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    fetchMock.mockReset();
  });

  it("fails without an API key and does not call textbee", async () => {
    vi.stubEnv("TEXTBEE_API_KEY", "");
    expect(await sendSms("0123456789", "hi")).toEqual({ ok: false, error: "TEXTBEE_API_KEY is not set" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts a normalized recipient and returns the batch ID", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: { success: true, smsBatchId: "batch-1" } }));

    expect(await sendSms("012-345 6789", "Collection at 5pm")).toEqual({ ok: true, providerRef: "batch-1" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.textbee.dev/api/v1/gateway/send-sms");
    expect(init.method).toBe("POST");
    expect(init.headers["x-api-key"]).toBe("test-key");
    expect(JSON.parse(init.body)).toEqual({ recipients: ["+60123456789"], message: "Collection at 5pm" });
  });

  it("sends the configured device ID", async () => {
    vi.stubEnv("TEXTBEE_DEVICE_ID", "device-9");
    fetchMock.mockResolvedValue(Response.json({ data: { smsBatchId: "b" } }));

    await sendSms("0123456789", "hi");

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).deviceId).toBe("device-9");
  });

  it("returns textbee's error for a non-200 response", async () => {
    fetchMock.mockResolvedValue(new Response("plan limit reached", { status: 429 }));

    expect(await sendSms("0123456789", "hi")).toEqual({ ok: false, error: "textbee 429: plan limit reached" });
  });

  it("returns network errors instead of throwing", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    expect(await sendSms("0123456789", "hi")).toEqual({ ok: false, error: "connect ECONNREFUSED" });
  });
});
