import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn(), update: vi.fn(), select: vi.fn(), order: vi.fn(), single: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
import { ordersService } from "./orders";
import { donationsService } from "../programmes/donations";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.from.mockReturnValue(mocks);
  mocks.select.mockReturnValue(mocks);
  mocks.order.mockReturnValue(mocks);
  mocks.update.mockReturnValue(mocks);
  mocks.eq.mockReturnValue(mocks);
  mocks.single.mockResolvedValue({ data: { id: "record-1" }, error: null });
});

describe("Customer and staff record boundaries", () => {
  it("filters My Orders to the signed-in customer", async () => {
    mocks.eq.mockResolvedValue({ data: [], error: null });
    await ordersService.list("customer-1");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "customer-1");
  });
  it("filters My Donations to the signed-in customer", async () => {
    mocks.eq.mockResolvedValue({ data: [], error: null });
    await donationsService.list("customer-2");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "customer-2");
  });
  it("order management changes only fulfilment status and notes, never amount or owner", async () => {
    await ordersService.update("record-1", "processing", "Preparing order");
    expect(mocks.update).toHaveBeenCalledWith({ status: "processing", admin_notes: "Preparing order" });
    expect(mocks.eq).toHaveBeenCalledWith("id", "record-1");
  });
  it("donation management changes notes only, never payment state", async () => {
    await donationsService.updateNotes("record-1", "Programme allocation");
    expect(mocks.update).toHaveBeenCalledWith({ admin_notes: "Programme allocation" });
  });
});