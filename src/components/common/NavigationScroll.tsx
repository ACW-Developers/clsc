import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset page/view navigation, while keeping deliberate section links useful. */
export function NavigationScroll() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const section = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (section) section.scrollIntoView({ behavior: "instant", block: "start" });
      else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, search, hash]);
  return null;
}