import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Activity,
  LogOut,
  LayoutDashboard,
  AlertTriangle,
  Menu,
  X,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navigation() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!session) return null;

  const role = String(session.role || "").toUpperCase();
  const isRescuer = role === "RESCUER";

  const navLinks = [
    ...(isRescuer
      ? [{ name: "Mission Control", path: "/rescuer-dashboard", icon: LayoutDashboard }]
      : [
        { name: "SOS Panel", path: "/dashboard", icon: AlertTriangle },
        { name: "Rescue Status", path: "/rescue-session", icon: Activity },
      ]),
    { name: "Profile Settings", path: "/profile", icon: User },
  ];

  const handleLogout = () => {
    logout();
    localStorage.removeItem("userRole");
    localStorage.removeItem("profileComplete");
    localStorage.removeItem("current_sos_id");
    window.location.reload();
  };

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-[#0A0A0A] border-r border-white/5 h-screen sticky top-0 z-50 text-white">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Activity className="w-6 h-6 text-orange-500" />
          </div>
          <span className="font-black uppercase tracking-tighter italic text-xl">
            CrisisCore
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.3em] mb-4 px-2">
            Operational Hub
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${location.pathname === link.path
                  ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">
                {link.name}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="mb-4 px-4 flex flex-col">
            <span className="text-[8px] font-mono text-gray-600 uppercase">
              Active Session
            </span>
            <span className="text-xs font-bold text-white uppercase">
              {session.name}
            </span>
            <span className="text-[8px] font-mono text-gray-500 uppercase">
              ID: {String(session.userId || "").slice(0, 8)}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-sm font-black uppercase tracking-widest border border-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <header className="lg:hidden flex items-center justify-between p-4 bg-[#0A0A0A] border-b border-white/5 sticky top-0 z-50 text-white">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-orange-500" />
          <span className="font-black uppercase tracking-tighter italic">
            CrisisCore
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 bg-[#0A0A0A] z-[60] lg:hidden flex flex-col text-white"
          >
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-orange-500" />
                <span className="font-black uppercase tracking-tighter italic">
                  CrisisCore
                </span>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X />
              </button>
            </div>

            <nav className="flex-1 p-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
                >
                  <link.icon className="w-6 h-6 text-orange-500" />
                  <span className="text-lg font-bold uppercase tracking-widest">
                    {link.name}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="p-6 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-sm"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
