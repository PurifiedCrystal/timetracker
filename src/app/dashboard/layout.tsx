'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Clock,
  BarChart3,
  User,
  FileDown,
  CreditCard,
  LogOut,
  Menu,
  X,
  Users,
  Shield,
  ToggleLeft,
  ToggleRight,
  Target
} from 'lucide-react';
import { signOut } from '@/lib/auth';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Create context for tracking mode and CA mode
const DashboardContext = createContext<{
  trackingMode: 'work' | 'habits';
  setTrackingMode: (mode: 'work' | 'habits') => void;
  californiaMode: boolean;
  setCaliforniaMode: (mode: boolean) => void;
  handleCAModeToggle: () => void;
}>({
  trackingMode: 'work',
  setTrackingMode: () => {},
  californiaMode: false,
  setCaliforniaMode: () => {},
  handleCAModeToggle: () => {},
});

export const useTrackingMode = () => useContext(DashboardContext);
export const useDashboardContext = () => useContext(DashboardContext);

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Clock },
  { name: 'Groups', href: '/dashboard/groups', icon: Users },
  { name: 'Export', href: '/dashboard/export', icon: FileDown },
  { name: 'History', href: '/dashboard/history', icon: BarChart3 },
  { name: 'CA Mode', href: '#', icon: ToggleLeft, isToggle: true },
];

const bottomNavigation = [
  { name: 'Profile', href: '/dashboard/settings', icon: User },
  { name: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
];

const adminNavigation = [
  { name: 'Admin Panel', href: '/dashboard/admin', icon: Shield },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trackingMode, setTrackingMode] = useState<'work' | 'habits'>('work');
  const [isGroupAdmin, setIsGroupAdmin] = useState(true); // TODO: Get from user profile
  const [californiaMode, setCaliforniaMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Load CA Mode from localStorage on mount
  useEffect(() => {
    const savedCAMode = localStorage.getItem('timetracker_california_mode');
    if (savedCAMode !== null) {
      setCaliforniaMode(JSON.parse(savedCAMode));
    }
    setMounted(true);
  }, []);

  const handleCAModeToggle = () => {
    const newMode = !californiaMode;
    setCaliforniaMode(newMode);
    // Save to localStorage
    localStorage.setItem('timetracker_california_mode', JSON.stringify(newMode));
  };

  return (
    <DashboardContext.Provider value={{
      trackingMode,
      setTrackingMode,
      californiaMode,
      setCaliforniaMode,
      handleCAModeToggle
    }}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
          <div
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
              sidebarOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setSidebarOpen(false)}
          />
          <div className={`relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-shrink-0 flex items-center px-4">
              <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
                <Clock className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">TimeTracker</span>
              </Link>
            </div>
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <nav className="px-2 space-y-1">
                {navigation.map((item) => {
                  const current = pathname === item.href;

                  if (item.isToggle && item.name === 'CA Mode') {
                    const ToggleIcon = californiaMode ? ToggleRight : ToggleLeft;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          handleCAModeToggle();
                          setSidebarOpen(false);
                        }}
                        className="group flex items-center w-full px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <ToggleIcon className={`mr-4 h-6 w-6 ${californiaMode ? 'text-blue-500' : 'text-gray-400'}`} />
                        {item.name}
                        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                          californiaMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {californiaMode ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                        current
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`mr-4 h-6 w-6 ${current ? 'text-blue-500' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Admin Section */}
                {isGroupAdmin && (
                  <>
                    <div className="pt-6 pb-2">
                      <div className="px-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Group Management
                        </h3>
                      </div>
                    </div>
                    {adminNavigation.map((item) => {
                      const current = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                            current
                              ? 'bg-orange-100 text-orange-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <item.icon className={`mr-4 h-6 w-6 ${current ? 'text-orange-500' : 'text-gray-400'}`} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </>
                )}
              </nav>
            </div>
            <div className="flex-shrink-0 border-t border-gray-200 p-4 pb-24">
              {/* Bottom Navigation */}
              {bottomNavigation.map((item) => {
                const current = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md mb-1 ${
                      current
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`mr-4 h-6 w-6 ${current ? 'text-blue-500' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                );
              })}

              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={handleSignOut}
                  className="flex-shrink-0 w-full group block"
                >
                  <div className="flex items-center px-2 py-2">
                    <LogOut className="inline-block h-6 w-6 text-gray-400 group-hover:text-gray-500 mr-4" />
                    <div>
                      <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                        Sign out
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Static sidebar for desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow border-r border-gray-200 pt-5 bg-white overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
                <Clock className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">TimeTracker</span>
              </Link>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item) => {
                  const current = pathname === item.href;

                  if (item.isToggle && item.name === 'CA Mode') {
                    const ToggleIcon = californiaMode ? ToggleRight : ToggleLeft;
                    return (
                      <button
                        key={item.name}
                        onClick={handleCAModeToggle}
                        className="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <ToggleIcon className={`mr-3 h-5 w-5 ${californiaMode ? 'text-blue-500' : 'text-gray-400'}`} />
                        {item.name}
                        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                          californiaMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {californiaMode ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        current
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${current ? 'text-blue-500' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Admin Section */}
                {isGroupAdmin && (
                  <>
                    <div className="pt-6 pb-2">
                      <div className="px-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Group Management
                        </h3>
                      </div>
                    </div>
                    {adminNavigation.map((item) => {
                      const current = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                            current
                              ? 'bg-orange-100 text-orange-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <item.icon className={`mr-3 h-5 w-5 ${current ? 'text-orange-500' : 'text-gray-400'}`} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </>
                )}
              </nav>

              {/* Bottom Navigation Section - Settings & Subscription above Sign Out */}
              <div className="px-2 pb-4 border-t border-gray-200 pt-4">
                {bottomNavigation.map((item) => {
                  const current = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                        current
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${current ? 'text-blue-500' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleSignOut}
                className="flex-shrink-0 w-full group block"
              >
                <div className="flex items-center">
                  <LogOut className="inline-block h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      Sign out
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
            <button
              type="button"
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 flex justify-between">
              <div className="flex-1 flex items-center">
                <span className="text-sm font-medium text-gray-900">Welcome back, Demo User</span>
              </div>
              <div className="ml-2 sm:ml-4 flex items-center md:ml-6 space-x-3">
                <LanguageSwitcher compact className="hidden sm:block" />
                <div className="flex items-center space-x-0.5 sm:space-x-1 bg-gray-100 rounded-lg p-0.5 sm:p-1">
                  <button
                    onClick={() => setTrackingMode('work')}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                      trackingMode === 'work'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Work
                  </button>
                  <button
                    onClick={() => setTrackingMode('habits')}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                      trackingMode === 'habits'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Habits
                  </button>
                </div>
              </div>
            </div>
          </div>

          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation - Only show on mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 py-2">
            <div className="flex items-center justify-around max-w-md mx-auto">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 transform hover:scale-110 active:scale-95"
              >
                <Target className={`h-5 w-5 transition-transform duration-200 ${
                  pathname === '/dashboard' ? 'text-green-600' : 'text-gray-600'
                }`} />
                <span className={`text-xs mt-1 ${
                  pathname === '/dashboard' ? 'text-green-600' : 'text-gray-600'
                }`}>Dashboard</span>
              </button>

              <button
                onClick={() => router.push('/dashboard/groups')}
                className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 transform hover:scale-110 active:scale-95"
              >
                <Users className={`h-5 w-5 transition-transform duration-200 ${
                  pathname === '/dashboard/groups' ? 'text-green-600' : 'text-gray-600'
                }`} />
                <span className={`text-xs mt-1 ${
                  pathname === '/dashboard/groups' ? 'text-green-600' : 'text-gray-600'
                }`}>Groups</span>
              </button>

              <button
                onClick={() => router.push('/dashboard/export')}
                className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 transform hover:scale-110 active:scale-95"
              >
                <FileDown className={`h-5 w-5 transition-transform duration-200 ${
                  pathname === '/dashboard/export' ? 'text-green-600' : 'text-gray-600'
                }`} />
                <span className={`text-xs mt-1 ${
                  pathname === '/dashboard/export' ? 'text-green-600' : 'text-gray-600'
                }`}>Export</span>
              </button>

              <button
                onClick={() => router.push('/dashboard/history')}
                className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 transform hover:scale-110 active:scale-95"
              >
                <BarChart3 className={`h-5 w-5 transition-transform duration-200 ${
                  pathname === '/dashboard/history' ? 'text-green-600' : 'text-gray-600'
                }`} />
                <span className={`text-xs mt-1 ${
                  pathname === '/dashboard/history' ? 'text-green-600' : 'text-gray-600'
                }`}>History</span>
              </button>

              <button
                onClick={handleCAModeToggle}
                className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 transform hover:scale-110 active:scale-95"
              >
                {californiaMode ? (
                  <ToggleRight className="h-5 w-5 text-blue-600 transition-transform duration-200" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-gray-600 transition-transform duration-200" />
                )}
                <span className={`text-xs mt-1 ${
                  californiaMode ? 'text-blue-600' : 'text-gray-600'
                }`}>CA Mode</span>
              </button>

            </div>
          </div>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}