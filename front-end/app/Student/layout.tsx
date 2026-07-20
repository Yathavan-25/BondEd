/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { 
  Search, Bell, LayoutDashboard, Users, Calendar, 
  BarChart2, ChevronRight, PanelLeft, X, ArrowLeft, Mic,
  GraduationCap,
  Summary
} from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const params = useParams();
  const pathname = usePathname();
  const studentId = params?.id as string;
  const isActiveSessionRoom = pathname?.match(/^\/Student\/[^\/]+\/Sessions\/[^\/]+$/);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
        setIsMobileSearchOpen(false); 
      }
    };

    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isActiveSessionRoom) {
    return <main className="w-full h-screen bg-slate-50">{children}</main>;
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans overflow-hidden relative">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-[#0000001a] shrink-0 transition-all duration-300 ease-in-out overflow-hidden
          ${isSidebarOpen 
            ? "w-70 translate-x-0" 
            : "w-70 -translate-x-full lg:w-0 lg:border-transparent"}
        `}
      >
        <div className="w-70 h-full flex flex-col">
          
          {/* FIXED HEADER (Logo) */}
          <div className="h-20.5 flex items-center justify-between px-6 border-b border-[#0000001a] shrink-0">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-[10px] bg-linear-to-br from-[#4f55ee] to-[#9c2fdf] flex items-center justify-center shadow-sm mr-3 shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">Bond<span className="text-primary-linear">Ed</span> </span>
            </div>
            
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* SCROLLABLE MIDDLE (Navigation) */}
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="px-5 flex flex-col justify-around h-87.5">
              <SidebarLink 
                icon={LayoutDashboard} 
                label="Dashboard" 
                href={`/Student/${studentId}/Dashboard`} 
                active={pathname?.includes("/Dashboard")} 
              />
              <SidebarLink 
                icon={Users} 
                label="Find Partners" 
                href={`/Student/${studentId}/FindPartners`} 
                active={pathname?.includes("/FindPartners")} 
              />
              <SidebarLink 
                icon={Mic} 
                label="AI Assistant" 
                href={`/Student/${studentId}/VoiceAssistant`} 
                active={pathname?.includes("/VoiceAssistant")} 
              />
              <SidebarLink 
                icon={Calendar} 
                label="Sessions" 
                href={`/Student/${studentId}/Sessions`} 
                active={pathname?.includes("/Sessions")} 
              />
              <SidebarLink 
                icon={BarChart2} 
                label="Analytics" 
                href={`/Student/${studentId}/Analytics`} 
                active={pathname?.includes("/Analytics")} 
              />
              <SidebarLink 
                icon={Summary} 
                label="Summary" 
                href={`/Student/${studentId}/Summary`} 
                active={pathname?.includes("/Summary")} 
              />
            </nav>
          </div>

          {/* FIXED FOOTER (User Profile) */}
          <Link href={`/Student/${studentId}/Profile`} className="shrink-0 p-4 border-t border-[#0000001a] bg-white block group">
            <div className="p-3 rounded-2xl group-hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#4f55ee] to-[#9c2fdf] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  RY
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-gray-900 truncate">Rajanikanth Y.</p>
                  <p className="text-xs text-gray-500">Student</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2 group-hover:text-gray-600 transition-colors" />
            </div>
          </Link>

        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* TOP BAR */}
        <header className="h-20.5 bg-white border-b border-[#0000001a] flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 relative">
          
          {/* If Mobile Search is OPEN, show full-width input */}
          {isMobileSearchOpen ? (
            <div className="flex items-center w-full gap-3 animate-in fade-in duration-200">
              <button 
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search partners, sessions..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1363CB] focus:ring-2 focus:ring-[#1363CB]/20 outline-none text-sm transition-all shadow-sm"
                />
              </div>
            </div>
          ) : (
            /* Standard View (Desktop or Mobile Search Closed) */
            <>
              <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors shrink-0"
                  aria-label="Toggle Sidebar"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>

                {/* Desktop Search */}
                <div className="relative w-full max-w-100 hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search partners, sessions, subjects" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB] outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                {/* Mobile Search Toggle Button */}
                <button 
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                >
                  <Search className="w-5 h-5" />
                </button>

                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
              </div>
            </>
          )}
        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// Sidebar Link Component
function SidebarLink({ icon: Icon, label, href, active = false }: any) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-[15px] text-sm font-semibold transition-all ${
        active 
        ? "bg-[#4992f2] text-white shadow-sm" 
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? "text-white" : "text-gray-400"}`} />
      {label}
    </Link>
  );
}