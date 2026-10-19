import { Outlet } from "react-router-dom";

/** Top-level shell shared by every page. Header/footer will be added here. */
export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
