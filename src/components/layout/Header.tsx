import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';

export function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsMenuOpen(false));

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);
  
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
      <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-full px-6 py-3 mx-auto">
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

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {[
              { path: '/dashboard/create', label: 'Buat Permintaan' },
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

          {/* User Menu */}
          <div ref={dropdownRef} className="relative ml-4 pl-4 border-l border-gray-200">
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
                        <p className="text-sm text-gray-500 font-medium mt-1">@{user?.username}</p>
                        
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {user?.role && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200 uppercase tracking-wide">
                                    {user.role}
                                </span>
                            )}
                            {user?.organization && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                                    {user.organization}
                                </span>
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
                  <div className="p-2 bg-gray-50/50 border-t border-gray-100">
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
      </div>
    </header>
  );
}
