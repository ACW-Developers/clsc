import { describe, expect, it } from "vitest";
import { availableStock, cartTotal } from "./bookshop";
import { checkoutSchema, stockSchema, type Book } from "@/services/bookshop/catalog";
const book = { id: "b", price: 850, is_published: true, bookshop_stock: [{ branch: "yaya", quantity: 7, is_available: true }, { branch: "kisumu", quantity: 0, is_available: true }] } as Book;
describe("Branch shopping rules", () => {
  it("uses only selected branch stock", () => { expect(availableStock(book, "yaya")).toBe(7); expect(availableStock(book, "kisumu")).toBe(0); });
  it("does not sell unavailable stock", () => { expect(availableStock({ ...book, bookshop_stock: [{ ...book.bookshop_stock[0], is_available: false }] }, "yaya")).toBe(0); });
  it("calculates quantity based cart totals", () => { expect(cartTotal([{ book_id: "b", quantity: 3 }], [book])).toBe(2550); });
  it("rejects invalid phone numbers for simulated M-Pesa", () => { expect(checkoutSchema.safeParse({ branch: "yaya", items: [{ book_id: "00000000-0000-4000-8000-000000000001", quantity: 1 }], phone: "123", success: true, requestId: "00000000-0000-4000-8000-000000000002" }).success).toBe(false); });
  it("requires distinct branch stock records", () => { expect(stockSchema.safeParse([{ branch: "yaya", quantity: 2, low_stock_threshold: 5, is_available: true }, { branch: "yaya", quantity: 4, low_stock_threshold: 5, is_available: true }]).success).toBe(false); });
});