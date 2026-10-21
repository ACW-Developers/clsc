import { Link } from "react-router-dom";
import type { ReactNode } from "react";

/** Renders hash links ("/#x") as anchors so the browser scrolls; others as router links. */
export function NavItem({
  to,
  className,
  children,
  onClick,
}: {
  to: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return to.includes("#") ? (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  ) : (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
