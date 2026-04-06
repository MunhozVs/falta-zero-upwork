import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ShieldAlert, 
  LineChart, 
  FileText, 
  Settings, 
  Server, 
  Activity, 
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const MENU_SECRETARY: NavItem[] = [
  { name: 'Visão Geral', path: '/', icon: LayoutDashboard },
  { name: 'Agenda do Dia', path: '/agenda', icon: Calendar },
  { name: 'Waitlist', path: '/waitlist', icon: Users },
  { name: 'Ações Manuais', path: '/escalations', icon: ShieldAlert },
];

const MENU_DOCTOR: NavItem[] = [
  { name: 'Performance e ROI', path: '/', icon: LineChart },
  { name: 'Protocolos Clínicos', path: '/protocolos', icon: FileText },
  { name: 'Configurações', path: '/config', icon: Settings },
];

const MENU_CTO: NavItem[] = [
  { name: 'Infraestrutura', path: '/', icon: Server },
  { name: 'Observabilidade', path: '/observability', icon: Activity },
  { name: 'Integrações (Tenants)', path: '/tenants', icon: Database },
];

export function Sidebar() {
  const { role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menus = {
    secretary: MENU_SECRETARY,
    doctor: MENU_DOCTOR,
    cto: MENU_CTO,
  };

  const navItems = menus[role];

  return (
    <aside 
      className={clsx(
        "h-screen sticky top-0 transition-all duration-300 ease-in-out border-r border-outline-variant/15 bg-surface-container-lowest",
        collapsed ? "w-[84px]" : "w-[280px]",
        !collapsed && "glass border-r-0"
      )}
    >
      <div className="h-20 flex items-center justify-between px-6 border-b border-outline-variant/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-ambient">
                <span className="text-white font-bold font-display leading-none">Z</span>
             </div>
             <span className="font-display font-bold text-xl text-primary tracking-tight">Falta</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-ambient">
            <span className="text-white font-bold font-display leading-none">ZF</span>
          </div>
        )}
      </div>

      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 bg-surface-container-lowest border border-outline-variant/20 rounded-full p-1 text-on-surface-variant hover:text-primary transition-colors shadow-sm"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="p-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-3 py-3 rounded-lg font-sans text-sm font-medium transition-all group relative",
              isActive 
                ? "text-primary bg-primary/5" 
                : "text-on-surface hover:bg-surface-container-low"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-md"></div>
                )}
                <item.icon 
                  size={20} 
                  className={clsx(
                    "transition-colors",
                    isActive ? "text-primary" : "text-on-surface-variant group-hover:text-primary/70",
                    collapsed && "mx-auto"
                  )} 
                />
                {!collapsed && <span>{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
