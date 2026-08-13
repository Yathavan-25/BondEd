/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { DotsRing } from "@/components/ui/dots-ring";
import { useParams, usePathname, useRouter } from "next/navigation";
import { 
  Search, Bell, LayoutDashboard, Users, Calendar, 
  BarChart2, PanelLeft, X, ArrowLeft, Mic,
  GraduationCap, Summary, Zap, Video, CreditCard, Check, Inbox, Clock,
  User, LogOut, FileText, ChevronUp, MessageSquareHeart
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import FeedbackModal from "../components/FeedbackModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  // User & Credits State
  const [userName, setUserName] = useState("Loading...");
  const [userInitials, setUserInitials] = useState("--");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [credits, setCredits] = useState({ vapi: 0, daily: 0 });
  const usageRef = useRef<HTMLDivElement>(null);

  // Sidebar Profile Popout State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ partners: any[], sessions: any[], summaries: any[] }>({ partners: [], sessions: [], summaries: [] });
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const studentId = params?.id as string;
  const isActiveSessionRoom = pathname?.match(/^\/Student\/[^\/]+\/Sessions\/[^\/]+$/);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else { setIsSidebarOpen(true); setIsMobileSearchOpen(false); }
    };
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch User Info, Credits & Received Notifications
  useEffect(() => {
    if (!studentId) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set User Name, Initials, and Photo for Sidebar/Header
        const name = user.displayName || user.email?.split('@')[0] || "Student";
        setUserName(name);
        if (user.email) setUserEmail(user.email);
        setUserInitials(name.substring(0, 2).toUpperCase());
        if (user.photoURL) setUserPhoto(user.photoURL);

        try {
          const token = await user.getIdToken();
          const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
          
          const [credRes, notifRes, profileRes] = await Promise.all([
            fetch(`${baseUrl}/api/payments/credits/${studentId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${baseUrl}/api/requests/received/${studentId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${baseUrl}/api/profile/${studentId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ]);
          
          if (credRes.ok) {
            const data = await credRes.json();
            setCredits({ 
                vapi: data.vapiMinutesRemaining || 0, 
                daily: data.dailyMinutesRemaining || 0 
            });
          }

          if (notifRes.ok) {
            const notifData = await notifRes.json();
            setNotifications(notifData);
          }

          if (profileRes.ok) {
            const pData = await profileRes.json();
            const prof = pData.profile || pData;
            if (prof?.avatarUrl) setUserPhoto(prof.avatarUrl);
          }
        } catch (err) {
          console.error("Failed to fetch layout data", err);
        }
      }
    });

    return () => unsubscribe();
  }, [studentId]);

  // Handle Global Search Live Fetch
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      // eslint-disable-next-line
      setSearchResults({ partners: [], sessions: [], summaries: [] });
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchLoading(true);
      setIsSearchOpen(true);
      try {
        const user = auth.currentUser;
        if (!user || !studentId) return;
        const token = await user.getIdToken();
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/search/${studentId}?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Global search fetch failed", err);
      } finally {
        setIsSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, studentId]);

  const handleRespondToNotification = async (requestId: string, action: 'accept' | 'decline') => {
    setNotifications(prev => prev.filter(n => n.id !== requestId));
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
      await fetch(`${baseUrl}/api/requests/${requestId}/respond`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ action })
      });
    } catch (err) {
      console.error("Failed to respond to request from notification", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/Login");
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (usageRef.current && !usageRef.current.contains(event.target)) setIsUsageOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setIsProfileMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isActiveSessionRoom) return <main className="w-full h-screen bg-slate-50">{children}</main>;

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans overflow-hidden relative">
      
      {isSidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-[#0000001a] shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? "w-70 translate-x-0" : "w-70 -translate-x-full lg:w-0 lg:border-transparent"}`}>
        <div className="w-70 h-full flex flex-col">
          <div className="h-20.5 flex items-center justify-between px-6 border-b border-[#0000001a] shrink-0">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#4f55ee] to-[#9c2fdf] flex items-center justify-center shadow-sm mr-3 shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">Bond<span className="text-[#9c2fdf]">Ed</span> </span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="px-5 flex flex-col justify-around h-[87.5%]">
              <SidebarLink icon={LayoutDashboard} label="Dashboard" href={`/Student/${studentId}/Dashboard`} active={pathname?.includes("/Dashboard")} />
              <SidebarLink icon={Users} label="Find Partners" href={`/Student/${studentId}/FindPartners`} active={pathname?.includes("/FindPartners")} />
              <SidebarLink icon={Mic} label="AI Assistant" href={`/Student/${studentId}/VoiceAssistant`} active={pathname?.includes("/VoiceAssistant")} />
              <SidebarLink icon={Calendar} label="Sessions" href={`/Student/${studentId}/Sessions`} active={pathname?.includes("/Sessions")} />
              <SidebarLink icon={BarChart2} label="Analytics" href={`/Student/${studentId}/Analytics`} active={pathname?.includes("/Analytics")} />
              <SidebarLink icon={Summary} label="Summary" href={`/Student/${studentId}/Summary`} active={pathname?.includes("/Summary")} />
            </nav>
          </div>

          {/* --- SIDEBAR USER PROFILE & POPOUT MENU --- */}
          <div className="relative shrink-0 p-4 border-t border-[#0000001a] bg-white" ref={profileMenuRef}>
            {isProfileMenuOpen && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={() => { setIsProfileMenuOpen(false); router.push(`/Student/${studentId}/Profile`); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <User className="w-4 h-4 text-[#1363CB]" /> View Profile & Settings
                </button>
                <div className="w-full h-px bg-gray-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full p-2.5 rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {userPhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */
<img src={userPhoto} alt={userName} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4f55ee] to-[#9c2fdf] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {userInitials}
                  </div>
                )}
                <div className="truncate text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500">Menu & Settings</p>
                </div>
              </div>
              <ChevronUp className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-20.5 bg-white border-b border-[#0000001a] flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 relative">
          {isMobileSearchOpen ? (
            <div className="flex items-center w-full gap-3 animate-in fade-in duration-200">
              <button onClick={() => setIsMobileSearchOpen(false)} className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors shrink-0"><ArrowLeft className="w-5 h-5" /></button>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus 
                  placeholder="Search partners, sessions, summaries..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1363CB] focus:ring-2 focus:ring-[#1363CB]/20 outline-none text-sm transition-all shadow-sm text-gray-800" 
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors shrink-0"><PanelLeft className="w-5 h-5" /></button>
                
                {/* GLOBAL SEARCH INPUT & OVERLAY */}
                <div className="relative w-full max-w-[400px] hidden md:block" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if(searchQuery.length >= 2) setIsSearchOpen(true); }}
                    placeholder="Search partners, sessions, summaries..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB] outline-none text-sm transition-all text-gray-800" 
                  />

                  {/* Live Search Overlay */}
                  {isSearchOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 z-50 max-h-96 overflow-y-auto space-y-4 animate-in fade-in slide-in-from-top-2">
                      {isSearchLoading && (
                        <div className="py-6 flex items-center justify-center text-gray-400 gap-2">
                          <DotsRing className="text-[#9C2FDF] w-8 h-8"  /> Searching...
                        </div>
                      )}

                      {!isSearchLoading && searchResults.partners.length === 0 && searchResults.sessions.length === 0 && searchResults.summaries.length === 0 && (
                        <p className="text-center text-xs text-gray-400 py-4">No matching results found.</p>
                      )}

                      {/* Partners Category */}
                      {!isSearchLoading && searchResults.partners.length > 0 && (
                        <div>
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Users className="w-3 h-3 text-[#1363CB]"/> Study Partners</h5>
                          <div className="space-y-1">
                            {searchResults.partners.map((p) => (
                              <div 
                                key={p.id} 
                                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); router.push(`/Student/${studentId}/FindPartners`); }}
                                className="p-2 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {p.avatarUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */
<img src={p.avatarUrl} className="w-7 h-7 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{p.initials}</div>
                                  )}
                                  <span className="text-xs font-bold text-gray-800 truncate">{p.name}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium">{p.subject}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sessions Category */}
                      {!isSearchLoading && searchResults.sessions.length > 0 && (
                        <div>
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-[#9C2FDF]"/> Collab Sessions</h5>
                          <div className="space-y-1">
                            {searchResults.sessions.map((s) => (
                              <div 
                                key={s.id} 
                                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); router.push(`/Student/${studentId}/Sessions/${s.id}`); }}
                                className="p-2 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between gap-2"
                              >
                                <span className="text-xs font-bold text-gray-800 truncate">{s.title}</span>
                                <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">{s.subject}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summaries Category */}
                      {!isSearchLoading && searchResults.summaries.length > 0 && (
                        <div>
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="w-3 h-3 text-emerald-600"/> Summaries & Insights</h5>
                          <div className="space-y-1">
                            {searchResults.summaries.map((sum) => (
                              <div 
                                key={sum.id} 
                                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); router.push(`/Student/${studentId}/Summary`); }}
                                className="p-2 hover:bg-gray-50 rounded-xl cursor-pointer space-y-0.5"
                              >
                                <p className="text-xs font-bold text-gray-800 truncate">{sum.title}</p>
                                <p className="text-[11px] text-gray-500 line-clamp-1">{sum.summarySnippet}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                
                {/* USAGE / CREDITS DROPDOWN */}
                <div className="relative" ref={usageRef}>
                  <button 
                    onClick={() => setIsUsageOpen(!isUsageOpen)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-gray-700">{credits.vapi}m <span className="hidden sm:inline">Left</span></span>
                  </button>

                  {/* Dropdown Menu */}
                  {isUsageOpen && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 shadow-xl rounded-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Current Balances</h4>
                      
                      <div className="space-y-4 mb-5">
                        <div>
                          <div className="flex justify-between text-sm font-bold mb-1.5">
                            <span className="flex items-center gap-1.5 text-gray-700"><Mic className="w-4 h-4 text-[#9C2FDF]"/> AI Voice</span>
                            <span className="text-[#9C2FDF]">{credits.vapi} mins</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#9C2FDF] h-full" style={{ width: `${Math.min((credits.vapi / 500) * 100, 100)}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm font-bold mb-1.5">
                            <span className="flex items-center gap-1.5 text-gray-700"><Video className="w-4 h-4 text-[#1363CB]"/> Live Collab</span>
                            <span className="text-[#1363CB]">{credits.daily} mins</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#1363CB] h-full" style={{ width: `${Math.min((credits.daily / 1000) * 100, 100)}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => { setIsUsageOpen(false); router.push(`/Student/${studentId}/Pricing`); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#1363CB] to-[#9C2FDF] text-white rounded-xl font-bold hover:shadow-lg transition-all"
                      >
                        <CreditCard className="w-4 h-4" /> Add Credits
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setIsFeedbackOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-all shadow-xs"
                >
                  <MessageSquareHeart className="w-4 h-4 text-[#1363CB]" />
                  <span className="hidden sm:inline">Feedback</span>
                </button>

                <button onClick={() => setIsMobileSearchOpen(true)} className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><Search className="w-5 h-5" /></button>
                
                {/* NOTIFICATIONS DROPDOWN */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)} 
                    className="relative p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white border border-gray-200 shadow-xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Inbox className="w-4 h-4 text-[#9C2FDF]" />
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Study Requests ({notifications.length})</h4>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-400">Live Updates</span>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 space-y-2">
                          <Bell className="w-8 h-8 mx-auto text-gray-300" />
                          <p className="text-xs font-semibold">No new study requests right now.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                          {notifications.map((n) => (
                            <div key={n.id} className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl transition-colors flex items-center justify-between gap-3 border border-gray-100">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {n.avatarUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={n.avatarUrl} alt={n.name} className="w-9 h-9 rounded-full object-cover shrink-0 shadow-xs" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                    {n.initials || "ST"}
                                  </div>
                                )}
                                <div className="truncate">
                                  <p className="text-xs font-bold text-gray-900 truncate">{n.name}</p>
                                  <p className="text-[11px] text-gray-500 truncate">{n.subject}</p>
                                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                    <Clock className="w-3 h-3" /> {n.sentAgo || "Just now"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button 
                                  onClick={() => handleRespondToNotification(n.id, 'accept')}
                                  title="Accept Request"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleRespondToNotification(n.id, 'decline')}
                                  title="Decline Request"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button 
                        onClick={() => { setIsNotifOpen(false); router.push(`/Student/${studentId}/FindPartners`); }}
                        className="w-full mt-3 py-2 text-center text-xs font-bold text-[#1363CB] hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        View all in Find Partners →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} userEmail={userEmail} userName={userName} />
    </div>
  );
}

function SidebarLink({ icon: Icon, label, href, active = false }: any) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-[15px] text-sm font-semibold transition-all ${active ? "bg-[#4992f2] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}>
      <Icon className={`w-5 h-5 ${active ? "text-white" : "text-gray-400"}`} />
      {label}
    </Link>
  );
}