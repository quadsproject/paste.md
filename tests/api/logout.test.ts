import { describe, it, expect } from "vitest";
import { POST } from "@/app/logout/route";

describe("POST /logout", () => {
  it("clears the session cookie and redirects to the app root", async () => {
    const response = await POST();

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("pm_admin_session=;");
    expect(setCookie).toContain("Max-Age=0");
    expect(setCookie).toContain("HttpOnly");
  });
});
