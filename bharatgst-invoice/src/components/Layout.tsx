import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  Bell
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Invoices', icon: FileText, path: '/invoices' },
  { name: 'Customers', icon: Users, path: '/customers' },
  { name: 'Inventory', icon: Package, path: '/products' },
  { name: 'Payments', icon: CreditCard, path: '/payments' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, profile, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 border-r border-slate-700",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center font-bold text-white shrink-0 shadow-lg">
            B
          </div>
          {isSidebarOpen && (
            <span className="text-xl font-bold tracking-tight">
              BharatGST <span className="text-xs font-normal opacity-60">v2.0</span>
            </span>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-link",
                location.pathname === item.path 
                  ? "sidebar-link-active" 
                  : "sidebar-link-inactive"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {isSidebarOpen && <span>{item.name}</span>}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {item.name}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-700 bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-xs shrink-0">
              {profile?.businessName?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider truncate">
                  {profile?.businessName || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-accent truncate">
                  {profile?.gstin || 'GSTIN Pending'}
                </p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full mt-4 flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors text-xs font-medium"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen flex flex-col",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-lg font-bold text-slate-900 leading-none">
              {navItems.find(i => i.path === location.pathname)?.name || 'BharatGST'}
            </h2>
            <div className="hidden sm:flex gap-2">
              <span className="px-2 py-1 bg-slate-100 text-[10px] font-bold rounded text-slate-500 uppercase">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <span className="px-2 py-1 bg-green-50 text-[10px] font-bold rounded text-accent border border-accent/20 uppercase">
                GST Compliant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2">
               <button className="text-xs font-semibold text-slate-500 px-3 py-1.5 hover:bg-slate-100 rounded-md transition-colors">
                 Search Data
               </button>
               <button 
                onClick={() => navigate('/invoices')}
                className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
               >
                 + New Invoice
               </button>
             </div>
             
             <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
               <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg relative transition-colors">
                 <Bell className="w-4 h-4" />
                 <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
               </button>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <footer className="h-10 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent"></div> 
              System Online
            </span>
            <span className="hidden sm:inline">Server: Asia-East1</span>
            <span className="hidden sm:inline">Last Sync: Just now</span>
          </div>
          <div className="flex gap-3">
            <span className="px-2 py-0.5 bg-slate-100 rounded cursor-pointer hover:bg-slate-200">हिन्दी</span>
            <span className="px-2 py-0.5 bg-primary text-white rounded cursor-default">English</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
