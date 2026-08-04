import { afterEach, describe, expect, it, vi } from "vitest";
import { loadWithFallback } from "@/lib/data-loading";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadWithFallback", () => {
  it("returns a safe fallback and logs the technical error when loading fails", async () => {
    const error = new Error("database connection failed");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(loadWithFallback(async () => { throw error; }, [], "EventsPage.getEvents")).resolves.toEqual({ data: [], hasError: true });
    expect(consoleError).toHaveBeenCalledWith("[EventsPage.getEvents] data load failed", error);
  });
});
