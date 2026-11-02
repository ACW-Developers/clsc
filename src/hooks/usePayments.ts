import { useMutation } from "@tanstack/react-query";
import { paymentsService } from "@/services/payments";
export const usePayment = () => useMutation({ mutationFn: paymentsService.start });