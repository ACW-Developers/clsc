import mpesaLogo from "@/assets/payments/mpesa.webp";
import paystackLogo from "@/assets/payments/paystack.webp";
import { cn } from "@/lib/utils";
import type { PaymentProvider } from "@/services/payments";

const methods: { id: PaymentProvider; label: string; logo: string; hint: string }[] = [
  { id: "mpesa", label: "M-Pesa", logo: mpesaLogo, hint: "Prompt on your phone" },
  { id: "paystack", label: "Paystack", logo: paystackLogo, hint: "Card & other options" },
];

export const payLabel = (m: PaymentProvider) => (m === "mpesa" ? "Pay with M-Pesa" : "Pay with Paystack");

export function PaymentMethodPicker({ value, onChange }: { value: PaymentProvider; onChange: (m: PaymentProvider) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">Payment method</legend>
      <div role="radiogroup" className="grid grid-cols-2 gap-3">
        {methods.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={value === m.id} onClick={() => onChange(m.id)}
            className={cn("flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 bg-card px-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === m.id ? "border-primary shadow-sm ring-1 ring-primary/20" : "border-border hover:border-primary/40")}>
            <img src={m.logo} alt={m.label} className="h-7 w-28 object-contain" />
            <span className="text-[11px] text-muted-foreground">{m.hint}</span>
          </button>
        ))}
      </div>
      {value === "mpesa" && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Enter your M-Pesa number below. You'll get a prompt on your phone — enter your M-Pesa PIN to approve. Sandbox mode: no real money is charged.
        </p>
      )}
    </fieldset>
  );
}

/** Small logo + label for receipts, from the stored method text. */
export function PaymentMethodBadge({ method }: { method?: string | null }) {
  if (!method) return null;
  const logo = /m-?pesa/i.test(method) ? mpesaLogo : /paystack/i.test(method) ? paystackLogo : null;
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      {logo && <img src={logo} alt="" className="h-4 w-12 object-contain" />}
      <span>{method}</span>
    </span>
  );
}
