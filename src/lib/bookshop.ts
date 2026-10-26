import type { Book, Branch } from "@/services/bookshop/catalog";
export type CartLine = { book_id: string; quantity: number };
export const stockFor = (book: Book, branch: Branch) => book.bookshop_stock.find(s => s.branch === branch);
export const availableStock = (book: Book, branch: Branch) => {
  const s = stockFor(book, branch);
  return book.is_published && s?.is_available ? s.quantity : 0;
};
export const cartTotal = (lines: CartLine[], books: Book[]) => lines.reduce((sum, line) => sum + (books.find(b => b.id === line.book_id)?.price ?? 0) * line.quantity, 0);