import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  resourcesService as svc,
  type ResourceKind,
} from "@/services/programmes/resources";

export const useResources = (kind: ResourceKind, all = false) =>
  useQuery({
    queryKey: ["resources", kind, all],
    queryFn: () => svc.list(kind, all),
  });

export function useContributions(management = false) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contributions", management ? "all" : user?.id],
    queryFn: () => svc.contributions(management ? undefined : user?.id),
    enabled: !!user,
  });
}
