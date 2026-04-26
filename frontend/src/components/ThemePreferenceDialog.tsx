import { Sun, Moon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemePreferenceDialog() {
  const { hasChosen, confirmChoice, theme } = useTheme();

  return (
    <Dialog open={!hasChosen}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Choose your appearance</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Pick the theme you prefer. You can change this anytime from the header.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <ThemeOption
            label="Light"
            description="Bright, high-contrast"
            active={theme === "light"}
            onClick={() => confirmChoice("light")}
            preview="light"
            icon={<Sun className="h-4 w-4" />}
          />
          <ThemeOption
            label="Dark"
            description="Easy on the eyes"
            active={theme === "dark"}
            onClick={() => confirmChoice("dark")}
            preview="dark"
            icon={<Moon className="h-4 w-4" />}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ThemeOption({
  label,
  description,
  active,
  onClick,
  preview,
  icon,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  preview: "light" | "dark";
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-3 rounded-md border p-3 text-left transition-colors",
        "hover:border-foreground/40",
        active ? "border-foreground" : "border-border",
      )}
    >
      <div
        className={cn(
          "h-20 w-full overflow-hidden rounded-sm border",
          preview === "light" ? "border-zinc-200 bg-[hsl(210_20%_99%)]" : "border-zinc-800 bg-[hsl(222_18%_7%)]",
        )}
      >
        <div
          className={cn(
            "flex h-5 items-center gap-1 border-b px-2",
            preview === "light" ? "border-zinc-200 bg-white" : "border-zinc-800 bg-[hsl(222_16%_10%)]",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", preview === "light" ? "bg-zinc-300" : "bg-zinc-700")} />
          <span className={cn("h-1.5 w-1.5 rounded-full", preview === "light" ? "bg-zinc-300" : "bg-zinc-700")} />
        </div>
        <div className="space-y-1.5 p-2">
          <div className={cn("h-1.5 w-3/5 rounded-sm", preview === "light" ? "bg-zinc-800" : "bg-zinc-200")} />
          <div className={cn("h-1 w-4/5 rounded-sm", preview === "light" ? "bg-zinc-300" : "bg-zinc-700")} />
          <div className={cn("h-1 w-2/5 rounded-sm", preview === "light" ? "bg-zinc-300" : "bg-zinc-700")} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <span className="text-muted-foreground group-hover:text-foreground">{icon}</span>
      </div>
    </button>
  );
}
