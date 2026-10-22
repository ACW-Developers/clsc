import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile, useRoles } from "@/hooks/useHospitality";
import { accountView, paths } from "@/routes/paths";

export const initials = (s: string) =>
  s.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/** Signed-in user's name + photo with Profile / Settings / Dashboard / Sign out. */
export function UserMenu() {
  const { user, signOut } = useAuth();
  const { isStaff } = useRoles();
  const me = useMyProfile();
  const nav = useNavigate();
  if (!user) return null;
  const name = me.data?.full_name || user.email || "Account";
  const base = isStaff ? `${paths.admin}?view=` : "/account?view=";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex shrink-0 items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-2 text-sm font-medium hover:bg-secondary" aria-label="Account menu">
        <Avatar className="h-8 w-8">
          <AvatarImage src={me.data?.avatar_url ?? undefined} alt="" className="object-cover" />
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials(name)}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[9rem] truncate md:inline">{name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`${base}profile`}><User className="h-4 w-4" /> Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`${base}settings`}><Settings className="h-4 w-4" /> Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={isStaff ? paths.admin : accountView("overview")}><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={async () => {
            await signOut();
            toast.success("You have been signed out");
            nav(paths.home);
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
