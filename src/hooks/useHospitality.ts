import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hospitalityService as svc } from "@/services/hospitality";
import { useAuth } from "./useAuth";

export const useServices = () =>
  useQuery({ queryKey: ["services"], queryFn: svc.listServices });
export const useSubServices = () =>
  useQuery({ queryKey: ["sub_services"], queryFn: svc.listSubServices });
export const useBookings = () => {
  const { isStaff, isLoading } = useRoles();
  return useQuery({
    queryKey: ["bookings"],
    queryFn: svc.listBookings,
    enabled: isStaff && !isLoading,
  });
};
/** Customer's own bookings (RLS limits rows to the signed-in user). */
export const useMyBookings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookings", "mine", user?.id],
    queryFn: svc.listBookings,
    enabled: !!user,
  });
};
export const useBookedRanges = (sub?: string) =>
  useQuery({
    queryKey: ["ranges", sub],
    queryFn: () => svc.bookedRanges(sub!),
    enabled: !!sub,
    refetchInterval: 15000,
  });
export const useProfiles = () => {
  const { isStaff, isLoading } = useRoles();
  return useQuery({
    queryKey: ["profiles"],
    queryFn: svc.listProfiles,
    enabled: isStaff && !isLoading,
  });
};
export const useAllRoles = () => {
  const { isStaff, isLoading } = useRoles();
  return useQuery({
    queryKey: ["roles"],
    queryFn: svc.listRoles,
    enabled: isStaff && !isLoading,
  });
};
export const useLogs = () => {
  const { isStaff, isLoading } = useRoles();
  return useQuery({
    queryKey: ["logs"],
    queryFn: svc.listLogs,
    enabled: isStaff && !isLoading,
  });
};
export const useSettings = () => {
  const { isSuperAdmin, isLoading } = useRoles();
  return useQuery({
    queryKey: ["settings"],
    queryFn: svc.getSettings,
    enabled: isSuperAdmin && !isLoading,
  });
};
export const useSetupStatus = () =>
  useQuery({ queryKey: ["setup"], queryFn: svc.setupStatus, staleTime: 0 });

export function useRoles() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["myRoles", user?.id],
    queryFn: () => (user ? svc.myRoles(user.id) : Promise.resolve([])),
    enabled: !!user,
  });
  const roles = q.data ?? [];
  return {
    ...q,
    roles,
    isSuperAdmin: roles.includes("super_admin"),
    isStaff: roles.includes("admin") || roles.includes("super_admin"),
  };
}

/** Generic mutation that toasts and refreshes the given cache keys. */
export function useAction<A, R>(
  fn: (a: A) => Promise<R>,
  keys: string[],
  success?: string,
) {
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
