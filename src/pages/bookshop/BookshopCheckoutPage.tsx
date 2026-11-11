import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, MapPin, ShieldCheck } from "lucide-react";
import { ShopFrame } from "@/components/bookshop/ShopFrame";
import { coverFallback } from "@/components/bookshop/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/bookshop/useCart";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import { PaymentMethodPicker, payLabel } from "@/components/common/PaymentMethod";
import { MpesaStatusDialog } from "@/components/common/MpesaStatusDialog";
import { usePayment } from "@/hooks/usePayments";
import { branchName } from "@/services/bookshop/catalog";
import { cartTotal, availableStock } from "@/lib/bookshop";
import { kes } from "@/lib/booking";
import { bookshopReceiptUrl, paths } from "@/routes/paths";

const phoneOk = (p: string) => /^(\+?254|0)[17][0-9]{8}$/.test(p);

export default function BookshopCheckoutPage() {
  const cart = useCart(), q = useCatalog(), nav = useNavigate(), client = useQueryClient();
  const [phone, setPhone] = useState(""), [touched, setTouched] = useState(false);
  const pay = usePayment({ inline: true });
  const books = q.data ?? [];
  const valid = cart.lines.length > 0 && cart.lines.every((l) => {
    const b = books.find((b) => b.id === l.book_id);
    return b && availableStock(b, cart.branch) >= l.quantity;
  });
  const cleanPhone = phone.replace(/\s/g, ""), total = cartTotal(cart.lines, books);
  const run = () => {
    setTouched(true);
    if (!phoneOk(cleanPhone)) return;
    pay.mutate({ kind: "bookshop", branch: cart.branch, items: cart.lines, phone: cleanPhone });
  };
  const prompt = pay.method === "mpesa" && pay.data ? pay.data : null;
  const completed = useCallback((p: { id: string }) => {
    sessionStorage.removeItem("cslc-payment-reference");
    cart.clear();
    void client.invalidateQueries();
    nav(bookshopReceiptUrl(p.id), { replace: true, state: { paid: true } });
  }, [cart, client, nav]);
  const close = () => pay.reset();

  return (
    <ShopFrame>
      <main className="container py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to={paths.bookshop} className="hover:text-primary">Bookshop</Link> / <Link to={paths.cart} className="hover:text-primary">Cart</Link> / Checkout
        </nav>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Checkout</h1>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" />CSLC Bookshop · {branchName(cart.branch)} collection</p>
        {q.isLoading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]"><Skeleton className="h-80 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
        ) : q.error ? (
          <p className="mt-8 text-destructive">{q.error.message}</p>
        ) : !valid && !prompt ? (
          <div className="mt-8 rounded-2xl border border-dashed p-10 text-center">
            <p className="mb-4">Your cart is empty or stock has changed.</p>
            <Button asChild className="rounded-full"><Link to={paths.cart}>Review cart</Link></Button>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
            <section aria-labelledby="pay-heading" className="space-y-6 rounded-2xl border bg-card p-5 sm:p-7">
              <div>
                <h2 id="pay-heading" className="text-lg font-semibold">Payment</h2>
                <p className="mt-1 text-sm text-muted-foreground">Test mode — M-Pesa sandbox and Paystack test payments only; no real money is charged.</p>
              </div>
              <PaymentMethodPicker value={pay.method} onChange={(m) => { pay.setMethod(m); pay.reset(); }} />
              <div className="space-y-2">
                <Label htmlFor="bookshop-phone">{pay.method === "mpesa" ? "M-Pesa phone number" : "Phone number"}</Label>
                <Input id="bookshop-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder="07XX XXX XXX" value={phone}
                  aria-invalid={touched && !phoneOk(cleanPhone)} aria-describedby="phone-help"
                  onChange={(e) => setPhone(e.target.value)} onBlur={() => phone && setTouched(true)} className="h-12 text-base" />
                <p id="phone-help" className={touched && !phoneOk(cleanPhone) ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                  {touched && !phoneOk(cleanPhone) ? "Enter a Safaricom or Airtel number, e.g. 0712 345 678." : "Used for your receipt and, with M-Pesa, the payment prompt."}
                </p>
              </div>
              {pay.error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{pay.error.message}</p>}
              <Button size="lg" className="h-12 w-full rounded-full text-base" disabled={pay.isPending || !phone || !valid} onClick={run}>
                <Lock className="h-4 w-4" />
                {pay.isPending ? (pay.method === "mpesa" ? "Sending prompt…" : "Opening Paystack…") : `${payLabel(pay.method)} · ${kes(total)}`}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-success" />Prices and stock are confirmed securely before your receipt is issued.</p>
            </section>
            <aside aria-label="Order summary" className="rounded-2xl border bg-secondary/40 p-5 lg:sticky lg:top-40">
              <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
              <ul className="space-y-3">
                {cart.lines.map((l) => {
                  const b = books.find((b) => b.id === l.book_id);
                  return (
                    <li key={l.book_id} className="flex items-center gap-3">
                      <span className="relative flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-card p-1">
                        <img src={b?.image_url || "/placeholder.svg"} alt="" onError={coverFallback} className="h-full w-full object-contain" />
                        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{l.quantity}</span>
                      </span>
                      <span className="line-clamp-2 min-w-0 flex-1 text-sm font-medium">{b?.title}</span>
                      <span className="shrink-0 text-sm font-semibold">{kes((b?.price ?? 0) * l.quantity)}</span>
                    </li>
                  );
                })}
              </ul>
              <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{kes(total)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Collection</dt><dd>Free</dd></div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold"><dt>Total</dt><dd className="text-primary">{kes(total)}</dd></div>
              </dl>
              <Link to={paths.cart} className="mt-4 block text-center text-sm font-medium text-primary hover:underline">Edit cart</Link>
            </aside>
          </div>
        )}
      </main>
      <MpesaStatusDialog reference={prompt?.reference ?? null} reused={prompt?.reused} amount={kes(total)} phone={phone} onClose={close} onCompleted={completed} />
    </ShopFrame>
  );
}
