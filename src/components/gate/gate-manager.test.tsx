import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GateManager } from "@/components/gate/gate-manager";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GateManager mutations", () => {
  it("submits once and updates the gate list without a document reload", async () => {
    let resolveRequest: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(<GateManager eventId="event-a" initialGates={[]} canWrite />);

    fireEvent.click(screen.getAllByRole("button", { name: "สร้าง Gate" })[0]);
    fireEvent.change(screen.getByPlaceholderText("เช่น Gate A"), { target: { value: "Gate A" } });
    const form = screen.getByRole("dialog").querySelector("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form!);
    fireEvent.submit(form!);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest?.({
        ok: true,
        json: async () => ({
          gate: {
            id: "gate-a",
            name: "Gate A",
            description: null,
            location: null,
            deviceCode: "DEVICE-A",
            isActive: true,
          },
        }),
      } as Response);
    });

    await waitFor(() => expect(screen.getByRole("heading", { name: "Gate A" })).toBeInTheDocument());
    expect(screen.getByText("สร้าง Gate แล้ว")).toBeInTheDocument();
  });
});