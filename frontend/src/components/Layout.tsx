import { NavLink, Outlet } from "react-router-dom";
import { Activity } from "lucide-react";
import { HealthDot } from "@/components/HealthDot";
import { cn } from "@/lib/utils";

export function Layout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-accent",
    );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Activity className="h-4 w-4" />
            </span>
            <span>FluWatch</span>
          </NavLink>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Report
            </NavLink>
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          </nav>

          <HealthDot />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border py-4">
        <div className="container text-center text-xs text-muted-foreground">
          FluWatch is a research tool. Reports are anonymous. Information shown is not medical advice.
        </div>
      </footer>
    </div>
  );
}
