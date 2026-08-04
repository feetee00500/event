import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScannerClient } from "@/components/scanner/scanner-client";

const scannerMocks = vi.hoisted(() => ({
  decode: vi.fn(),
  constructorOptions: vi.fn(),
}));

vi.mock("@zxing/browser", () => ({
  BrowserQRCodeReader: class {
    constructor(_hints?: unknown, options?: unknown) { scannerMocks.constructorOptions(options); }
    decodeFromVideoDevice(deviceId: string | undefined, video: HTMLVideoElement, callback: (result?: { getText(): string }) => void) {
      return scannerMocks.decode(deviceId, video, callback);
    }
  },
}));

type Deferred<T> = { promise: Promise<T>; resolve(value: T): void; reject(reason: unknown): void };
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const gates = [{ id: "gate-a", name: "Gate A" }];

function response(body: object, ok = true): Response {
  return { ok, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

beforeEach(() => {
  scannerMocks.decode.mockReset();
  scannerMocks.constructorOptions.mockReset();
  vi.restoreAllMocks();
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { enumerateDevices: vi.fn().mockResolvedValue([
      { kind: "videoinput", deviceId: "camera-a", label: "Camera A" },
      { kind: "videoinput", deviceId: "camera-b", label: "Camera B" },
    ]) },
  });
  Object.defineProperty(window.crypto, "randomUUID", { configurable: true, value: vi.fn(() => "device-test") });
  window.localStorage.clear();
});

describe("ScannerClient camera lifecycle", () => {
  it("opens and stops the camera repeatedly with QR-only throttling", async () => {
    const firstStop = vi.fn();
    const secondStop = vi.fn();
    scannerMocks.decode.mockResolvedValueOnce({ stop: firstStop }).mockResolvedValueOnce({ stop: secondStop });
    render(<ScannerClient eventId="event-a" eventName="IIRFA" gates={gates} />);

    fireEvent.click(screen.getByRole("button", { name: "เปิดกล้อง" }));
    await screen.findByRole("button", { name: "หยุดกล้อง" });
    expect(scannerMocks.constructorOptions).toHaveBeenCalledWith({ delayBetweenScanAttempts: 400, delayBetweenScanSuccess: 750 });
    fireEvent.click(screen.getByRole("button", { name: "หยุดกล้อง" }));
    expect(firstStop).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "เปิดกล้อง" }));
    await waitFor(() => expect(scannerMocks.decode).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: "หยุดกล้อง" }));
    expect(secondStop).toHaveBeenCalledTimes(1);
  });

  it("stops the previous decoder when switching cameras", async () => {
    const firstStop = vi.fn();
    const secondStop = vi.fn();
    scannerMocks.decode.mockResolvedValueOnce({ stop: firstStop }).mockResolvedValueOnce({ stop: secondStop });
    render(<ScannerClient eventId="event-a" eventName="IIRFA" gates={gates} />);

    fireEvent.click(screen.getByRole("button", { name: "เปิดกล้อง" }));
    await screen.findByRole("button", { name: "สลับกล้อง" });
    fireEvent.click(screen.getByRole("button", { name: "สลับกล้อง" }));

    await waitFor(() => expect(scannerMocks.decode).toHaveBeenCalledTimes(2));
    expect(firstStop).toHaveBeenCalledTimes(1);
    expect(scannerMocks.decode.mock.calls[1]?.[0]).toBe("camera-b");
  });

  it("releases controls when unmounted after camera start", async () => {
    const stop = vi.fn();
    scannerMocks.decode.mockResolvedValue({ stop });
    const view = render(<ScannerClient eventId="event-a" eventName="IIRFA" gates={gates} />);
    fireEvent.click(screen.getByRole("button", { name: "เปิดกล้อง" }));
    await screen.findByRole("button", { name: "หยุดกล้อง" });
    view.unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("stops controls that resolve after the component has unmounted", async () => {
    const pending = deferred<{ stop: () => void }>();
    const stop = vi.fn();
    scannerMocks.decode.mockReturnValue(pending.promise);
    const view = render(<ScannerClient eventId="event-a" eventName="IIRFA" gates={gates} />);
    fireEvent.click(screen.getByRole("button", { name: "เปิดกล้อง" }));
    await waitFor(() => expect(scannerMocks.decode).toHaveBeenCalledTimes(1));
    view.unmount();
    await act(async () => pending.resolve({ stop }));
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("shows a safe error when camera permission is denied", async () => {
    scannerMocks.decode.mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    render(<ScannerClient eventId="event-a" eventName="IIRFA" gates={gates} />);
    fireEvent.click(screen.getByRole("button", { name: "เปิดกล้อง" }));
    expect(await screen.findByText(/ไม่สามารถเปิดกล้องได้/)).toBeInTheDocument();
  });
});

describe("ScannerClient scan locking", () => {
  it("allows only one request while a scan is in flight and suppresses the same QR", async () => {
    const stop = vi.fn();
    let scanCallback: ((result?: { getText(): string }) => void) | undefined;
    scannerMocks.decode.mockImplementation((_device, _video, callback) => { scanCallback = callback; return Promise.resolve({ stop }); });
    const pendingFetch = deferred<Response>();
    const fetchMock = vi.fn().mockReturnValue(pendingFetch.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(<ScannerClient eventId="event-a" eventName="IIRFA" gates={gates} />);
    fireEvent.click(screen.getByRole("button", { name: "เปิดกล้อง" }));
    await waitFor(() => expect(scanCallback).toBeDefined());

    await act(async () => { scanCallback?.({ getText: () => "qr-a" }); scanCallback?.({ getText: () => "qr-b" }); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => pendingFetch.resolve(response({ success: true, status: "CHECKED_IN", message: "ok", attendee: { name: "A", ticketType: "General", ticketNumber: "T1" }, gate: { name: "Gate A" } })));
    await screen.findByText("Check-in สำเร็จ");

    await act(async () => { scanCallback?.({ getText: () => "qr-a" }); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports a network failure without leaving a request lock", async () => {
    let scanCallback: ((result?: { getText(): string }) => void) | undefined;
    scannerMocks.decode.mockImplementation((_device, _video, callback) => { scanCallback = callback; return Promise.resolve({ stop: vi.fn() }); });
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(response({ success: false, status: "INVALID_TOKEN", message: "invalid" }, false));
    vi.stubGlobal("fetch", fetchMock);
    render(<ScannerClient eventId="event-a" eventName="IIRFA" gates={gates} />);
    fireEvent.click(screen.getByRole("button", { name: "เปิดกล้อง" }));
    await waitFor(() => expect(scanCallback).toBeDefined());
    await act(async () => { scanCallback?.({ getText: () => "qr-a" }); });
    expect(await screen.findByText("เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "สแกนถัดไป" }));
    await waitFor(() => expect(scannerMocks.decode).toHaveBeenCalledTimes(2));
  });
});