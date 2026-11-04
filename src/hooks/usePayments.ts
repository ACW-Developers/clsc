import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { paymentsService, type PaymentInput, type PaymentProvider } from "@/services/payments";
export const usePayment = () => {
  const [method, setMethod] = useState<PaymentProvider>("mpesa");
  const m = useMutation({ mutationFn: paymentsService.start });
  return { ...m, method, setMethod, mutate: (p: PaymentInput) => m.mutate({ ...p, provider: method }) };
};
