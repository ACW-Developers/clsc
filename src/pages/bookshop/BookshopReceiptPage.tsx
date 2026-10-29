import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PosReceipt } from "@/components/common/PosReceipt";
import { catalogService, branchName } from "@/services/bookshop/catalog";
import { kes } from "@/lib/booking";
import { accountView } from "@/routes/paths";

export default function BookshopReceiptPage() {
  const { id = "" } = useParams();
  const q = useQuery({
    queryKey: ["bookshopReceipt", id],
    queryFn: () => catalogService.receipt(id),
  });
  const items = useQuery({
    queryKey: ["bookshopItems", q.data?.order_id],
    queryFn: () =>
      q.data ? catalogService.items(q.data.order_id) : Promise.resolve([]),
    enabled: !!q.data,
  });
  const r = q.data;
  return (
    <PosReceipt
      loading={q.isLoading}
      error={q.error?.message}
      title="CSLC BOOKSHOP RECEIPT"
      subtitle={r ? `${branchName(r.branch)} Branch` : undefined}
      number={r?.receipt_number}
      date={r?.created_at}
      rows={[
        ["Branch", r ? branchName(r.branch) : ""],
        ["Payment method", r?.method],
        ["Phone", r?.phone],
        ["Simulation reference", r?.reference],
      ]}
      amount={r?.amount}
      thanks={r ? `Collect at ${branchName(r.branch)}. Thank you for choosing CSLC Bookshop.` : undefined}
      backTo={accountView("receipts")}
      backLabel="Back to receipts"
    >
      <section className="mt-4 border-t border-dashed pt-3 text-xs">
        <div className="flex justify-between font-bold">
          <span>ITEM / QTY</span>
          <span>AMOUNT</span>
        </div>
        {(items.data ?? []).map((i) => (
          <div key={i.id} className="py-2">
            <p className="font-semibold">{i.title}</p>
            <div className="flex justify-between">
              <span>
                {i.quantity} × {kes(i.unit_price)}
              </span>
              <span>{kes(i.unit_price * i.quantity)}</span>
            </div>
          </div>
        ))}
      </section>
    </PosReceipt>
  );
}
