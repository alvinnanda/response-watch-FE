import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { NotificationBell } from '../notifications/NotificationBell';

export function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsMenuOpen(false));
  useOnClickOutside(mobileMenuRef, () => setIsMobileMenuOpen(false));

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    if (isMenuOpen || isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, isMobileMenuOpen]);
  
  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 sm:px-0">
      <div className="relative bg-white/50 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-full px-6 py-3 mx-auto transition-all duration-300">
       {/* <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-full px-6 py-3 mx-auto transition-all duration-300 flex justify-between items-center"> */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 mr-8">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
              <svg 
                className="w-4 h-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-800 hidden sm:block">
              ResponseWatch
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { path: '/dashboard/create', label: 'Buat Permintaan' },
              { path: '/dashboard/notes', label: 'Notes' },
              { path: '/dashboard/monitoring', label: 'Monitoring' },
              { path: '/dashboard/groups', label: 'Grup' }
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-black/5 text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* User Menu */}
            <div ref={dropdownRef} className="relative border-l border-gray-200 pl-4">
             <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
              id="user-menu-button"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors focus:outline-none ring-offset-2 focus:ring-2 ring-black/10"
             >
              <span className="text-xs font-semibold">
                {getInitials(user?.full_name || user?.full_name || 'User')}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div 
                role="menu" 
                aria-orientation="vertical" 
                aria-labelledby="user-menu-button"
                className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in origin-top-right ring-1 ring-black/5"
              >
                  {/* User Profile Section */}
                  <div className="p-6 pb-5 bg-white">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4 group">
                             <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-900 to-gray-700 flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                <span className="text-2xl font-bold tracking-tight">
                                    {getInitials(user?.full_name || 'User')}
                                </span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-white flex items-center justify-center">
                              <span className="sr-only">Online</span>
                            </div>
                        </div>
                        
                        <h4 className="text-lg font-bold text-gray-900 leading-tight">
                            {user?.full_name || 'User'}
                        </h4>
                        <p className="text-sm text-gray-500 font-medium mt-1">{user?.username}</p>
                        
                        <div className="mt-4 flex flex-col items-center gap-2">
                            {user?.plan && (
                                <Link to="/pricing" className="group/plan relative">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wide transition-transform group-hover/plan:scale-105 ${
                                        user.plan === 'enterprise' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        user.plan === 'pro' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        user.plan === 'basic' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                        'bg-green-50 text-green-700 border-green-200' // free
                                    }`}>
                                        {user.plan} Plan
                                    </span>
                                    {user.subscription_expires_at && (
                                        <span className="block text-[10px] text-gray-400 mt-1 font-medium">
                                            Exp: {moment(user.subscription_expires_at).format('DD-MM-YYYY')}
                                        </span>
                                    )}
                                </Link>
                            )}
                        </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 mx-6"></div>

                  {/* Contact Info (if needed, simplified) */}
                   <div className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                             </svg>
                          </div>
                          <span className="truncate flex-1 font-medium">{user?.email}</span>
                      </div>
                   </div>

                  {/* Actions */}
                  <div className="bg-gray-50/50 border-t border-gray-100 flex flex-col gap-1">
                    <Link
                      to="/complete-profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full relative overflow-hidden px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white transition-all flex items-center justify-between group shadow-sm ring-1 ring-gray-100"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Pengaturan Akun
                      </span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Link>
                    <button
                        onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                        }}
                        className="w-full relative overflow-hidden px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50/80 transition-all rounded-xl flex items-center justify-between group"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                             Keluar
                        </span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                  </div>
                </div>
            )}
          
          </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {isMobileMenuOpen && (
            <div 
                ref={mobileMenuRef}
                className="absolute top-full left-0 right-0 mt-4 p-2 bg-white rounded-3xl border border-gray-100 shadow-xl md:hidden animate-fade-in-down origin-top"
            >
              <div className="flex flex-col gap-1 p-2">
                {[
                  { path: '/dashboard/monitoring', label: 'Monitoring' },
                  { path: '/dashboard/create', label: 'Buat Permintaan' },
                  { path: '/dashboard/groups', label: 'Grup' },
                  { path: '/dashboard/notes', label: 'Notes' }
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group ${
                      isActive(item.path)
                        ? 'bg-black text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    {item.label}
                    {isActive(item.path) && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
