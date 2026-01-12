import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCog,
  Shield,
  CreditCard, 
  ArrowUpDown, 
  FileText, 
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/residents', icon: Users, label: 'Warga' },
  { href: '/pengurus', icon: UserCog, label: 'Pengurus' },
  { href: '/ronda', icon: Shield, label: 'Jadwal Ronda' },
  { href: '/transactions', icon: ArrowUpDown, label: 'Bayar & Transaksi' },
  { href: '/reports', icon: FileText, label: 'Laporan' },
  { href: '/profile', icon: User, label: 'Profil' },
  { href: '/settings', icon: Settings, label: 'Setelan' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Iuran RT</h1>
          </div>
          {user && (
            <Link to="/profile">
              <Avatar className="w-8 h-8 border border-primary/20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Iuran RT</h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">Admin System</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4 transition-transform", isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

          <div className="p-4 border-t border-sidebar-border/50 space-y-4">
            {user && (
              <Link to="/profile" className="block group">
                <div className="px-3 py-3 bg-muted/30 rounded-lg border border-border/50 group-hover:bg-muted/50 transition-colors flex items-center gap-3">
                  <Avatar className="w-8 h-8 border border-primary/20">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5 opacity-60">Session</p>
                    <p className="text-xs font-medium text-foreground truncate">{profile?.full_name || user.email}</p>
                  </div>
                </div>
              </Link>
            )}
            <Button
              variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 h-10 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs font-medium">Keluar Sistem</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 lg:p-10 animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/40 pb-safe-area-inset-bottom h-[calc(4.5rem+env(safe-area-inset-bottom))] flex justify-around items-center px-2">
        {[navItems[0], navItems[3], navItems[1], navItems[4], navItems[5]].map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all",
                isActive ? "text-primary scale-105" : "text-muted-foreground opacity-50"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              <span className="text-[10px] font-bold tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
