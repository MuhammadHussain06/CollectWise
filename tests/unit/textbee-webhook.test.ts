import { describe, expect, it } from "vitest";
import { verifyTextbeeSignature } from "@/lib/textbee-webhook";
import { signTextbee } from "../helpers/textbee";

const SECRET = "a-signing-secret-of-20+-chars";
const BODY = JSON.stringify({ webhookEvent: "MESSAGE_RECEIVED", message: "MISSED" });

describe("verifyTextbeeSignature", () => {
  it("accepts a correctly signed, fresh request", () => {
    expect(verifyTextbeeSignature(BODY, signTextbee(BODY, SECRET), SECRET)).toBe(true);
  });

  it("accepts an upper-case hex digest", () => {
    const header = signTextbee(BODY, SECRET).replace(/v1=(\w+)/, (_, hex: string) => `v1=${hex.toUpperCase()}`);
    expect(verifyTextbeeSignature(BODY, header, SECRET)).toBe(true);
  });

  it("rejects a missing header", () => {
    expect(verifyTextbeeSignature(BODY, null, SECRET)).toBe(false);
  });

  it("rejects a signature made with another secret", () => {
    expect(verifyTextbeeSignature(BODY, signTextbee(BODY, "some-other-secret-value"), SECRET)).toBe(false);
  });

  it("rejects a body changed after signing", () => {
    const header = signTextbee(BODY, SECRET);
    expect(verifyTextbeeSignature(BODY.replace("MISSED", "SPAM"), header, SECRET)).toBe(false);
  });

  it("rejects timestamps more than 5 minutes old or ahead", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(verifyTextbeeSignature(BODY, signTextbee(BODY, SECRET, now - 301), SECRET)).toBe(false);
    expect(verifyTextbeeSignature(BODY, signTextbee(BODY, SECRET, now + 301), SECRET)).toBe(false);
  });

  it.each(["", "garbage", "t=abc,v1=00", "t=123", "v1=deadbeef"])("rejects malformed header %j", (header) => {
    expect(verifyTextbeeSignature(BODY, header, SECRET)).toBe(false);
  });
});
