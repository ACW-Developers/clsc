import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useHospitality";
import { ordersService } from "@/services/bookshop/orders";

export function useOrders(management = false) {
  const { user } = useAuth();
  const { isStaff, isLoading } = useRoles();
  return useQuery({
    queryKey: ["orders", management ? "staff" : "mine", user?.id],
    queryFn: () => {
      if (!user) throw new Error("Please sign in");
      return ordersService.list(management ? undefined : user.id);
    },
    enabled: !!user && (!management || (isStaff && !isLoading)),
  });
}
