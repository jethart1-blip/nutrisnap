import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, Apple, TrendingUp, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/train', icon: Dumbbell, label: 'Train' },
  { to: '/nutrition', icon: Apple, label: 'Nutrition' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-pageBg">
      {children}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface2 z-20">
        <div className="max-w-sm mx-auto flex items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive ? 'text-accent' : 'text-textMuted'
                }`
              }
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
