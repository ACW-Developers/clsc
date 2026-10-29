import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { programmesService as svc } from "@/services/programmes/programmes";

export const useEvents = (all = false) =>
  useQuery({ queryKey: ["events", all], queryFn: () => svc.listEvents(all) });

export const useMaterials = (all = false) =>
  useQuery({
    queryKey: ["materials", all],
    queryFn: () => svc.listMaterials(all),
  });

export function useTickets(management = false) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tickets", management ? "all" : user?.id],
    queryFn: () => svc.listTickets(management ? undefined : user?.id),
    enabled: !!user,
  });
}

export function useReadingHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["materialHistory", user?.id],
    queryFn: () => svc.history(user!.id),
    enabled: !!user,
  });
}
