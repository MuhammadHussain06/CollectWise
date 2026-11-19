import { expect, test } from "@playwright/test";

test.describe("pages", () => {
  test("home links to check-in and the dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "CollectWise" })).toBeVisible();

    await page.getByRole("link", { name: "Collector check-in" }).click();
    await expect(page).toHaveURL(/\/checkin$/);
    await expect(page.getByRole("heading", { name: "Collector check-in" })).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: "JMB dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "JMB dashboard" })).toBeVisible();
  });

  test("pages load without browser errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    for (const path of ["/", "/checkin", "/dashboard"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
    }
    expect(errors).toEqual([]);
  });

  test("unknown routes return 404", async ({ page }) => {
    const res = await page.goto("/does-not-exist");
    expect(res?.status()).toBe(404);
  });
});

test.describe("installable app", () => {
  test("serves a web manifest with icons", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBe(true);
    const manifest = await res.json();
    expect(manifest).toMatchObject({ name: "CollectWise", display: "standalone", start_url: "/" });

    for (const icon of manifest.icons) {
      const iconRes = await request.get(icon.src);
      expect(iconRes.ok(), icon.src).toBe(true);
      expect(iconRes.headers()["content-type"]).toContain("image/png");
    }
  });

  test("links the manifest from the page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest\.webmanifest/);
  });
});

test.describe("API security", () => {
  test("SMS webhook rejects unsigned requests", async ({ request }) => {
    const res = await request.post("/api/sms/incoming", { data: { webhookEvent: "MESSAGE_RECEIVED" } });
    expect(res.status()).toBe(401);
  });

  test("SMS webhook rejects a forged signature", async ({ request }) => {
    const res = await request.post("/api/sms/incoming", {
      data: { webhookEvent: "MESSAGE_RECEIVED" },
      headers: { "x-textbee-signature": `t=${Math.floor(Date.now() / 1000)},v1=${"0".repeat(64)}` },
    });
    expect(res.status()).toBe(401);
  });

  test("alert job does not run for anonymous callers", async ({ request }) => {
    const res = await request.get("/api/cron/alerts");
    expect(res.status()).not.toBe(200);
  });
});
