import { useQuery } from "@tanstack/react-query";
import { activitiesService as svc } from "@/services/programmes/activities";

export const useAreaActivities = (area?: string) =>
  useQuery({
    queryKey: ["activities", area],
    queryFn: () => svc.listByArea(area!),
    enabled: !!area,
  });

export const useActivitiesAdmin = () =>
  useQuery({ queryKey: ["activities", "all"], queryFn: svc.listAll });
