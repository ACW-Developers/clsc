import { useQuery } from "@tanstack/react-query";
import { supportService as svc } from "@/services/support";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useHospitality";

export const useEnquiries = () => {
  const { isStaff, isLoading } = useRoles();
  return useQuery({
    queryKey: ["enquiries"],
    queryFn: svc.listEnquiries,
    enabled: !isLoading && isStaff,
  });
};

export const useMyTickets = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tickets", user?.id],
    queryFn: svc.myTickets,
    enabled: !!user,
  });
};

export const useAllTickets = () => {
  const { isStaff, isLoading } = useRoles();
  return useQuery({
    queryKey: ["tickets", "all"],
    queryFn: svc.myTickets, // staff RLS returns all rows
    enabled: !isLoading && isStaff,
  });
};

export const useNotifications = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: svc.myNotifications,
    enabled: !!user,
    refetchInterval: 30_000,
  });
};
