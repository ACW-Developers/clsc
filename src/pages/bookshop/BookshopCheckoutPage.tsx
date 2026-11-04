import { useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone, AlertTriangle } from "lucide-react";
import { ShopFrame } from "@/components/bookshop/ShopFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart } from "@/hooks/bookshop/useCart";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import { PaymentMethodPicker, payLabel } from "@/components/common/PaymentMethod";
import { usePayment } from "@/hooks/usePayments";
import { branchName } from "@/services/bookshop/catalog";
import { cartTotal, availableStock } from "@/lib/bookshop";
import { kes } from "@/lib/booking";
import { paths } from "@/routes/paths";
export default function BookshopCheckoutPage() {
  const cart = useCart(),
    q = useCatalog(),
    [phone, setPhone] = useState("");
  const pay = usePayment();
  const books = q.data ?? [],
    valid =
      cart.lines.length > 0 &&
      cart.lines.every((l) => {
        const b = books.find((b) => b.id === l.book_id);
        return b && availableStock(b, cart.branch) >= l.quantity;
      });
  const run = () => pay.mutate({ kind: "bookshop", branch: cart.branch, items: cart.lines, phone: phone.replace(/\s/g, "") });
  return (
    <ShopFrame>
      <main className="container max-w-xl py-10">
        <h1 className="mb-2 font-serif text-3xl font-bold">
          Bookshop checkout
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          CSLC Bookshop · {branchName(cart.branch)}
        </p>
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Paystack · Test mode.</strong> Use test payment details only; no real money is charged. A successful test reduces branch stock
            and creates a receipt.
          </AlertDescription>
        </Alert>
        {q.isLoading ? (
          <p>Loading order…</p>
        ) : q.error ? (
          <p className="text-destructive">{q.error.message}</p>
        ) : !valid ? (
          <div>
            <p className="mb-4">Your cart is empty or stock has changed.</p>
            <Button asChild>
              <Link to={paths.cart}>Review cart</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="divide-y border-y">
              {cart.lines.map((l) => (
                <div
                  key={l.book_id}
                  className="flex justify-between gap-3 py-3 text-sm"
                >
                  <span>
                    {l.quantity} ×{" "}
                    {books.find((b) => b.id === l.book_id)?.title}
                  </span>
                  <span className="shrink-0">
                    {kes(
                      (books.find((b) => b.id === l.book_id)?.price ?? 0) *
                        l.quantity,
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{kes(cartTotal(cart.lines, books))}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Collection at {branchName(cart.branch)} bookshop.
            </p>
            {pay.error && <p role="alert" className="text-sm text-destructive">{pay.error.message}</p>}
            <PaymentMethodPicker value={pay.method} onChange={pay.setMethod} />
            <div className="space-y-2">
              <Label htmlFor="bookshop-phone">Phone number</Label>
              <Input
                id="bookshop-phone"
                type="tel"
                maxLength={16}
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={pay.isPending || !phone}
              onClick={run}
            >
              <Smartphone className="h-4 w-4" />
              {pay.isPending ? "Processing…" : payLabel(pay.method)}
            </Button>

            <Link
              to={paths.cart}
              className="block text-center text-sm text-primary"
            >
              Back to cart
            </Link>
          </div>
        )}
      </main>
    </ShopFrame>
  );
}
