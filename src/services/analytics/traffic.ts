import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
export const trafficSchema = z.object({
  session: z.string().uuid(), type: z.enum(["visit", "click"]),
  path: z.string().min(1).max(200).regex(/^\/[^?#]*$/),
  device: z.enum(["Desktop", "Mobile", "Tablet"]),
  os: z.enum(["Windows", "macOS", "iOS", "Android", "Linux", "Other"]),
});
export const trafficService = {
  async track(input: z.infer<typeof trafficSchema>) {
    const p = trafficSchema.parse(input);
    const { error } = await supabase.rpc("track_traffic", { _session_id: p.session, _event_type: p.type, _path: p.path, _device: p.device, _os: p.os });
    if (error) throw new Error(error.message);
  },
  async list() {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data, error } = await supabase.from("traffic_events").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(10000);
    if (error) throw new Error(error.message);
    return data;
  },
};