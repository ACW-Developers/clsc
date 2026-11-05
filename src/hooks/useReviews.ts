import { useQuery } from "@tanstack/react-query";
import { reviewsService as svc, type ReviewKind } from "@/services/reviews";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useHospitality";

export const useReviews = (kind: ReviewKind, id: string) =>
  useQuery({ queryKey: ["reviews", kind, id], queryFn: () => svc.forTarget(kind, id), enabled: !!id });

export const useReviewEligible = (kind: ReviewKind, id: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reviews", "eligible", kind, id, user?.id],
    queryFn: () => svc.eligible(kind, id),
    enabled: !!user && !!id,
  });
};

export const useAllReviews = () => {
  const { isSuperAdmin, isLoading } = useRoles();
  return useQuery({ queryKey: ["reviews", "all"], queryFn: svc.all, enabled: !isLoading && isSuperAdmin });
};
