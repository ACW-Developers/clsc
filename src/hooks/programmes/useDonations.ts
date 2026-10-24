import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useHospitality";
import { donationsService } from "@/services/programmes/donations";

export function useDonations(management = false) {
  const { user } = useAuth();
  const { isStaff, isLoading } = useRoles();
  return useQuery({
    queryKey: ["donations", management ? "staff" : "mine", user?.id],
    queryFn: () => {
      if (!user) throw new Error("Please sign in");
      return donationsService.list(management ? undefined : user.id);
    },
    enabled: !!user && (!management || (isStaff && !isLoading)),
  });
}