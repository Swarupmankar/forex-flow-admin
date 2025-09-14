import { useState } from "react";
import { logout } from "@/API/auth.api";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/API/store";

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Settings,
  CreditCard,
  Bell,
  Wallet,
  DollarSign,
  ChevronDown,
  User,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clients", url: "/clients", icon: Users },

  { title: "Deposit Requests", url: "/deposits", icon: TrendingUp },
  { title: "Transaction History", url: "/deposit-history", icon: TrendingUp },
  { title: "Withdrawals", url: "/withdrawals", icon: TrendingDown },
  { title: "Spread Profiles", url: "/accounts", icon: CreditCard },
  { title: "Account Types", url: "/account-types", icon: Settings },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Support", url: "/support", icon: MessageCircle },
  { title: "Admin Wallet", url: "/wallet", icon: Wallet },
  { title: "Payment Setup", url: "/payment-setup", icon: DollarSign },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="fixed left-0 top-0 h-full w-60 bg-gradient-to-br from-sidebar-background to-sidebar-background-secondary border-r border-sidebar-border shadow-xl z-40">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border/50 px-4">
        <div className="text-xl font-bold text-sidebar-foreground tracking-wide">
          <span className="text-sidebar-primary">Vault</span>
          <span className="text-sidebar-foreground">Pro</span>
          <span className="text-sidebar-foreground/60 text-sm ml-2 font-normal">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);

            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                  active
                    ? "text-sidebar-foreground bg-sidebar-accent/40 shadow-sm before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-sidebar-primary before:rounded-r-full"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                  )}
                />
                <span
                  className={cn(
                    "transition-colors",
                    active
                      ? "text-sidebar-foreground font-semibold"
                      : "text-sidebar-foreground/80 group-hover:text-sidebar-foreground"
                  )}
                >
                  {item.title}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Profile Section */}
      <div className="border-t border-sidebar-border/50 p-4 mt-auto">
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-sidebar-accent/30 transition-all duration-200 group"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 flex items-center justify-center shadow-sm">
              <User className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-sidebar-foreground">
                Admin User
              </div>
              <div className="text-xs text-sidebar-foreground/60">
                Super Admin
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-sidebar-foreground/60 transition-all duration-200 group-hover:text-sidebar-foreground",
                showProfileDropdown && "rotate-180"
              )}
            />
          </button>

          {showProfileDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-sidebar-background-secondary border border-sidebar-border rounded-lg shadow-xl backdrop-blur-sm">
              <div className="py-2">
                <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition-colors">
                  <Settings className="h-4 w-4" />
                  <span>Account Settings</span>
                </button>
                <div className="my-1 border-t border-sidebar-border/30" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
