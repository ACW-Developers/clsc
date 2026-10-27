import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/services/bookshop/catalog";
import { useAuth } from "@/hooks/useAuth";
export function useCatalog() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["books", user?.id],
    queryFn: catalogService.list,
    staleTime: 0,
    refetchInterval: 15000,
  });
}
export function useBookshopReceipts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookshopReceipts", user?.id],
    queryFn: catalogService.receipts,
    enabled: !!user,
  });
}
