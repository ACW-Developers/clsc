import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useRoles } from "@/hooks/useHospitality";
import { trafficService } from "@/services/analytics/traffic";
export function useTrafficTracking() {
  const { pathname } = useLocation();
  useEffect(() => {
    let session = sessionStorage.getItem("cslc-traffic-session");
    if (!session) { session = crypto.randomUUID(); sessionStorage.setItem("cslc-traffic-session", session); }
    const ua = navigator.userAgent;
    const device = /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop";
    const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Other";
    // No query strings, account IDs, field values, IP addresses or click labels are collected.
    const path = pathname.split("/").map((s) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(s) ? ":id" : s).join("/").slice(0, 200);
    const send = (type: "visit" | "click") => { void trafficService.track({ session, type, path, device, os }).catch(() => undefined); };
    send("visit");
    const click = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a,button,[role=button]")) send("click");
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [pathname]);
}
export function useTraffic() {
  const { isStaff } = useRoles();
  return useQuery({ queryKey: ["traffic"], queryFn: trafficService.list, enabled: isStaff, refetchInterval: 60000 });
}