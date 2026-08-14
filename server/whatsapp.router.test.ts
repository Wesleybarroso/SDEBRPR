import { beforeEach, describe, expect, it, vi } from "vitest";

const numbers = [{ id: 1, userId: 42, label: "Comercial", phone: "5511999999999", instanceName: "comercial", apiUrl: "https://evolution.test", apiKey: "masked", isActive: true, isDefault: true, keepAlive: true, connectionStatus: "connected", lastHeartbeatAt: new Date(), lastError: null, scheduleCronTaskUid: null }];
const listWhatsappNumbers = vi.fn(async (userId: number) => numbers.filter(row => row.userId === userId));
const saveWhatsappNumber = vi.fn(async (userId: number, input: { id?: number; label: string }) => { if (input.id) Object.assign(numbers[0], { label: input.label }); else numbers.push({ ...numbers[0], id: 2, userId, label: input.label }); return { success: true, id: input.id ?? 2 }; });
const removeWhatsappNumber = vi.fn(async (_userId: number, id: number) => { const index = numbers.findIndex(row => row.id === id); if (index >= 0) numbers.splice(index, 1); return { success: true }; });
const setWhatsappDefault = vi.fn(async (_userId: number, id: number) => { numbers.forEach(row => { row.isDefault = row.id === id; }); return { success: true }; });
const setWhatsappActive = vi.fn(async (_userId: number, id: number, isActive: boolean) => { const row = numbers.find(item => item.id === id); if (row) row.isActive = isActive; return { success: true }; });
const getWhatsappNumberSecret = vi.fn(async (_userId: number, id?: number) => numbers.find(row => row.id === id));
const setWhatsappScheduleTaskUid = vi.fn(async () => ({ success: true }));
const createHeartbeatJob = vi.fn(async () => ({ taskUid: "task-123" }));
const deleteHeartbeatJob = vi.fn(async () => undefined);

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, listWhatsappNumbers, saveWhatsappNumber, removeWhatsappNumber, setWhatsappDefault, setWhatsappActive, getWhatsappNumberSecret, setWhatsappScheduleTaskUid };
});

vi.mock("./_core/heartbeat", () => ({ createHeartbeatJob, deleteHeartbeatJob, updateHeartbeatJob: vi.fn() }));

const { appRouter } = await import("./routers");

describe("whatsapp numbers router", () => {
  const user = { id: 42, openId: "whatsapp-test", role: "user", name: "Test", email: "test@example.com", loginMethod: "test", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), preferences: null } as const;
  const caller = () => appRouter.createCaller({ user, req: { headers: {} } as any, res: {} as any });

  beforeEach(() => { numbers.splice(1); numbers[0].isDefault = true; numbers[0].isActive = true; vi.clearAllMocks(); });

  it("lists and saves an additional instance", async () => {
    await expect(caller().whatsapp.list()).resolves.toHaveLength(1);
    await expect(caller().whatsapp.save({ label: "Suporte", phone: "5511888888888", instanceName: "suporte", apiUrl: "https://evolution.test", apiKey: "secret", keepAlive: true })).resolves.toEqual({ success: true, id: 2 });
    expect(saveWhatsappNumber).toHaveBeenCalledWith(42, expect.objectContaining({ label: "Suporte", keepAlive: true }));
  });

  it("edits an existing instance without losing its identity", async () => {
    await expect(caller().whatsapp.save({ id: 1, label: "Comercial atualizado", phone: "5511999999999", instanceName: "comercial", apiUrl: "https://evolution.test", keepAlive: true })).resolves.toEqual({ success: true, id: 1 });
    expect(saveWhatsappNumber).toHaveBeenCalledWith(42, expect.objectContaining({ id: 1, label: "Comercial atualizado" }));
  });

  it("accepts the five-minute heartbeat expression", async () => {
    await expect(caller().whatsapp.persistent({ id: 1, enabled: true, cron: "0 */5 * * * *" })).resolves.toMatchObject({ success: true, enabled: true, taskUid: "task-123" });
    expect(createHeartbeatJob).toHaveBeenCalledWith(expect.objectContaining({ cron: "0 */5 * * * *", path: "/api/scheduled/evolutionHeartbeat" }), expect.any(String));
  });

  it("disables the heartbeat and clears its task UID", async () => {
    numbers[0].scheduleCronTaskUid = "task-existing";
    await expect(caller().whatsapp.persistent({ id: 1, enabled: false, cron: "0 */5 * * * *" })).resolves.toEqual({ success: true, enabled: false });
    expect(deleteHeartbeatJob).toHaveBeenCalledWith("task-existing", expect.any(String));
    expect(setWhatsappScheduleTaskUid).toHaveBeenCalledWith(42, 1, null);
  });

  it("supports default, active state and removal operations", async () => {
    await caller().whatsapp.setDefault({ id: 1 });
    await caller().whatsapp.setActive({ id: 1, isActive: false });
    await caller().whatsapp.remove({ id: 1 });
    expect(setWhatsappDefault).toHaveBeenCalledWith(42, 1);
    expect(setWhatsappActive).toHaveBeenCalledWith(42, 1, false);
    expect(removeWhatsappNumber).toHaveBeenCalledWith(42, 1);
  });
});
