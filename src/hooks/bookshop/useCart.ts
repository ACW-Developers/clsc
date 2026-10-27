import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { Branch } from "@/services/bookshop/catalog";
import type { CartLine } from "@/lib/bookshop";
const schema = z.object({
  branch: z.enum(["yaya", "kisumu"]),
  lines: z
    .array(
      z.object({
        book_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .max(50),
});
type Cart = { branch: Branch; lines: CartLine[] };
const empty: Cart = { branch: "yaya", lines: [] };
const read = (): Cart => {
  try {
    const v = schema.safeParse(
      JSON.parse(localStorage.getItem("cslc-bookshop-cart") ?? "null"),
    );
    return v.success ? (v.data as Cart) : empty;
  } catch {
    return empty;
  }
};
let state = read();
const listeners = new Set<() => void>();
function commit(next: Cart) {
  state = next;
  try {
    localStorage.setItem("cslc-bookshop-cart", JSON.stringify(state));
  } catch {
    /* cart still works without browser storage */
  }
  listeners.forEach((f) => f());
}
window.addEventListener("storage", (e) => {
  if (e.key === "cslc-bookshop-cart") {
    state = read();
    listeners.forEach((f) => f());
  }
});
export function useCart() {
  const cart = useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
    () => state,
  );
  return {
    ...cart,
    count: cart.lines.reduce((n, l) => n + l.quantity, 0),
    setBranch(branch: Branch) {
      commit({ branch, lines: branch === cart.branch ? cart.lines : [] });
    },
    add(book_id: string, branch: Branch, max: number) {
      if (max < 1) return;
      const lines = branch === cart.branch ? cart.lines : [];
      const found = lines.find((l) => l.book_id === book_id);
      const quantity = Math.min(99, max, (found?.quantity ?? 0) + 1);
      commit({
        branch,
        lines: found
          ? lines.map((l) => (l.book_id === book_id ? { ...l, quantity } : l))
          : [...lines, { book_id, quantity }],
      });
    },
    quantity(book_id: string, quantity: number) {
      commit({
        ...cart,
        lines:
          quantity <= 0
            ? cart.lines.filter((l) => l.book_id !== book_id)
            : cart.lines.map((l) =>
                l.book_id === book_id
                  ? { ...l, quantity: Math.min(99, quantity) }
                  : l,
              ),
      });
    },
    clear() {
      commit({ ...cart, lines: [] });
    },
  };
}
