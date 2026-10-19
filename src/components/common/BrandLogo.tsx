import logo from "@/assets/cslc-logo.webp.asset.json";
import { cn } from "@/lib/utils";

/** Full CSLC logo (crest + name). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img src={logo.url} alt="Christian Student Leadership Centre – Ufungamano House" width={1920} height={640} className={cn("h-12 w-auto", className)} />
  );
}
