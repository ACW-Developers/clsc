import { useQuery } from "@tanstack/react-query";
import { leadershipService as svc } from "@/services/leadership";

export const useLeadership = () =>
  useQuery({ queryKey: ["leadership"], queryFn: svc.list });

export const useLeadershipAdmin = () =>
  useQuery({ queryKey: ["leadership", "all"], queryFn: svc.listAll });
