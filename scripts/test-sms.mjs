// Sends one test SMS with the textbee account in .env.local.
// Usage: npm run sms:test -- 0123456789 "optional message"
const [phone, message = "CollectWise test message"] = process.argv.slice(2);
if (!phone) {
  console.error('Usage: npm run sms:test -- <phone> ["message"]');
  process.exit(1);
}
if (!process.env.TEXTBEE_API_KEY) {
  console.error("TEXTBEE_API_KEY is missing from .env.local");
  process.exit(1);
}

const digits = phone.replace(/\D/g, "");
const recipient = digits.startsWith("0") ? `+60${digits.slice(1)}` : `+${digits}`;
const body = { recipients: [recipient], message };
if (process.env.TEXTBEE_DEVICE_ID) body.deviceId = process.env.TEXTBEE_DEVICE_ID;

const res = await fetch("https://api.textbee.dev/api/v1/gateway/send-sms", {
  method: "POST",
  headers: { "x-api-key": process.env.TEXTBEE_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
console.log(res.status, await res.text());
process.exit(res.ok ? 0 : 1);
