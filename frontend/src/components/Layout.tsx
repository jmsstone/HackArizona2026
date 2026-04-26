import { NavLink, Outlet } from "react-router-dom";
import { HealthDot } from "@/components/HealthDot";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemePreferenceDialog } from "@/components/ThemePreferenceDialog";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/epicenter-logo-light.svg";
import logoDark from "@/assets/epicenter-logo-dark.svg";

export function Layout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative px-3 py-1.5 text-sm transition-colors",
      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      isActive &&
        "after:absolute after:inset-x-3 after:-bottom-[13px] after:h-px after:bg-foreground",
    );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ThemePreferenceDialog />
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="container grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-6">
          <NavLink to="/" className="flex items-center tracking-tight justify-self-start" aria-label="Epicenter home">
            <img src={logoLight} alt="Epicenter" className="h-10 w-auto dark:hidden sm:h-12" />
            <img src={logoDark} alt="Epicenter" className="hidden h-10 w-auto dark:block sm:h-12" />
          </NavLink>

          <nav className="flex items-center gap-1 justify-self-center">
            <NavLink to="/" end className={linkClass}>
              Report
            </NavLink>
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/map" className={linkClass}>
              Map
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 justify-self-end">
            <HealthDot />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border py-5">
        <div className="container flex flex-col items-center gap-1 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Epicenter — research tool, not medical advice.</span>
          <span>Anonymous reporting · CDC FluView baselines</span>
        </div>
      </footer>
    </div>
  );
}
