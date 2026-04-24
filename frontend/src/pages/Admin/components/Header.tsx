
import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
  logoUrl?: string;
}

const Header: React.FC<HeaderProps> = ({ logoUrl, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = user?.fullName || user?.name || user?.email || 'Admin';
  const userRole = user?.role === 'admin' ? 'Admin' : 'User';
  const userAvatar = user?.avatarUrl || 'https://picsum.photos/seed/admin/40/40';

  return (
    <header className="h-14 md:h-16 flex items-center justify-between px-3 md:px-4 bg-background-light border-b border-gray-700 flex-shrink-0">
      {/* Left: logo */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={onToggleSidebar}
            className="p-1.5 md:p-2 rounded-md bg-background-dark text-gray-300 hover:bg-gray-700 hover:text-white mr-1 lg:hidden"
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain rounded bg-white flex-shrink-0" />
        )}
        <h1 className="text-sm md:text-lg font-semibold text-text-primary truncate">Admin Dashboard</h1>
      </div>

      {/* Right side icons and user menu */}
      <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 md:space-x-3 hover:bg-gray-700 rounded-lg px-1.5 md:px-2 py-1 transition-colors"
          >
            <img
              src={userAvatar}
              alt="User Avatar"
              className="w-7 h-7 md:w-10 md:h-10 rounded-full flex-shrink-0"
            />
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-white text-xs md:text-base truncate max-w-[120px] md:max-w-none">{userName}</div>
              <div className="text-xs text-gray-400">{userRole}</div>
            </div>
            <ChevronDown 
              className={`w-3 h-3 md:w-4 md:h-4 text-gray-400 transition-transform hidden sm:block flex-shrink-0 ${isMenuOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Dropdown menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-background-light border border-gray-700 rounded-lg shadow-xl z-50">
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
