import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import {
  LayoutDashboard,
  Upload,
  MessageSquare,
  BookOpen,
  Layers,
  History,
  FolderHeart,
  User,
  BarChart3,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Bell,
  GraduationCap,
  Sparkles,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout, isMock, setMockRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Materials', href: '/upload', icon: Upload },
    { name: 'Ask AI Assistant', href: '/ask-ai', icon: MessageSquare },
    { name: 'Quiz Generator', href: '/quiz', icon: BookOpen },
    { name: 'Flashcards', href: '/flashcards', icon: Layers },
    { name: 'Study History', href: '/history', icon: History },
    { name: 'Shared Library', href: '/library', icon: FolderHeart },
    { name: 'Analytics Reports', href: '/reports', icon: BarChart3 },
    { name: 'My Profile', href: '/profile', icon: User },
  ];

  // Only show moderator page if role is moderator or admin
  const isStaff = profile?.role === 'moderator' || profile?.role === 'admin';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  const activeClass = (path: string) => {
    return location.pathname === path
      ? 'bg-brand-50 text-brand-600 border-l-4 border-brand-500 font-semibold dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200';
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'moderator':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-blue-50 text-brand-700 border border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static lg:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <div className="p-1.5 bg-gradient-brand rounded-lg text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1">
              Studyys
            </span>
          </Link>
          <button className="lg:hidden text-slate-500 hover:text-slate-700" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 overflow-y-auto scrollbar-thin px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${activeClass(
                  item.href
                )}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {isStaff && (
            <Link
              to="/moderator"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${activeClass(
                '/moderator'
              )}`}
              onClick={() => setSidebarOpen(false)}
            >
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-500" />
              <span className="font-medium text-amber-700">Moderator Panel</span>
            </Link>
          )}
        </nav>

        {/* Mock Role Switcher (Visible in development mock auth mode) */}
        {isMock && (
          <div className="p-4 mx-4 mb-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Mock Sandbox Role
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['student', 'moderator', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setMockRole(r)}
                  className={`text-[10px] py-1 rounded font-semibold border capitalize transition-all ${
                    profile?.role === r
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar Footer (User Info & Logout) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex flex-col gap-2">
          {profile && (
            <div className="flex items-center gap-3 px-2 py-1">
              <img
                src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={profile.full_name}
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{profile.full_name}</p>
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5 ${getRoleBadgeColor(profile.role)}`}>
                  {profile.role}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/35 transition-all font-medium mt-1 w-full text-left"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 hidden md:block capitalize">
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Helper info */}
            <span className="text-xs text-slate-400 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded hidden sm:inline-block">
              {profile?.college || 'Engineering Student'}
            </span>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Toggle Dark Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Notification Center Trigger */}
            <div className="relative">
              <button
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Notifications</span>
                      <button className="text-xs text-brand-500 hover:underline">Mark all read</button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">New Study Guide Generated</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Gemini generated flashcards for your uploaded notes.</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Quiz Completed</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">You scored 8/10 on the Database Systems quiz.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <img
                  src={profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                />
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-45" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-750">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Signed in as</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{profile?.full_name}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/history"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Study History
                    </Link>
                    <hr className="border-slate-100 dark:border-slate-700 my-1" />
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Router Main Content Viewport */}
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-slate-50 dark:bg-slate-950/50 p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
