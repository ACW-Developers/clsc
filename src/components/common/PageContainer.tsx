import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/** Consistent page width and spacing for all pages. */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("container flex-1 py-10", className)}>{children}</div>
  );
}
