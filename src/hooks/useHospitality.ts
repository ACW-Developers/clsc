import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hospitalityService as svc } from "@/services/hospitality";
import { useAuth } from "./useAuth";

export const useServices = () => useQuery({ queryKey: ["services"], queryFn: svc.listServices });
export const useSubServices = () => useQuery({ queryKey: ["sub_services"], queryFn: svc.listSubServices });
export const useBookings = () => useQuery({ queryKey: ["bookings"], queryFn: svc.listBookings });
export const useProfiles = () => useQuery({ queryKey: ["profiles"], queryFn: svc.listProfiles });
export const useAllRoles = () => useQuery({ queryKey: ["roles"], queryFn: svc.listRoles });
export const useLogs = () => useQuery({ queryKey: ["logs"], queryFn: svc.listLogs });
export const useSettings = () => useQuery({ queryKey: ["settings"], queryFn: svc.getSettings });
export const useSetupStatus = () => useQuery({ queryKey: ["setup"], queryFn: svc.setupStatus, staleTime: 0 });

export function useRoles() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["myRoles", user?.id], queryFn: () => svc.myRoles(user!.id), enabled: !!user });
  const roles = q.data ?? [];
  return {
    ...q,
    roles,
    isSuperAdmin: roles.includes("super_admin"),
    isStaff: roles.includes("admin") || roles.includes("super_admin"),
  };
}

/** Generic mutation that toasts and refreshes the given cache keys. */
export function useAction<A, R>(fn: (a: A) => Promise<R>, keys: string[], success?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      qc.invalidateQueries({ queryKey: ["logs"] });
      if (success) toast.success(success);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
