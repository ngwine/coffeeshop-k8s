import React, { useState, useEffect, useRef } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, ChevronDown, ChevronUp } from 'lucide-react';

const ICONS: { [key: string]: React.ElementType } = {
  Dashboard: LayoutDashboard,
  Orders: ShoppingCart,
  Customers: Users,
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NavLink: React.FC<{
  to: string;
  pageName: string;
  onClick?: () => void;
  icon: React.ElementType;
}> = ({ to, pageName, onClick, icon: Icon }) => {
  return (
    <li>
      <RouterNavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
            isActive
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-background-light hover:text-white'
          }`
        }
        end={to === '/admin' || to === '/admin/dashboard'}
      >
        <Icon className="w-5 h-5 mr-3" />
        <span className="font-medium">{pageName}</span>
      </RouterNavLink>
    </li>
  );
};

const ProductMenu: React.FC<SidebarProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const visibleProductPages = [
    { name: 'Product List', to: '/admin/products' },
    { name: 'Category List', to: '/admin/categories' }
  ];

  return (
    <li>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 my-1 rounded-lg transition-colors duration-200 text-text-secondary hover:bg-background-light hover:text-white"
      >
        <div className="flex items-center">
          <Package className="w-5 h-5 mr-3" />
          <span className="font-medium">Products</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {isOpen && (
        <ul className="pl-6 mt-1 space-y-1 overflow-visible">
          {visibleProductPages.map((page) => (
            <li key={page.name} className="overflow-visible">
              <RouterNavLink
                to={page.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-lg text-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-background-light hover:text-white'
                  }`
                }
                end={page.to === '/admin/products'}
              >
                {page.name}
              </RouterNavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const sidebarRef = useRef<HTMLElement | null>(null);

  return (
    <aside
      ref={sidebarRef as unknown as React.RefObject<HTMLElement>}
      className={`bg-background-light fixed z-40 rounded-lg border border-gray-700 shadow-xl transform-gpu transition-all duration-300 ease-in-out origin-top
        left-0 top-14 md:top-16 w-64 max-w-[85vw] h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] max-h-[calc(100vh-3.5rem)] md:max-h-[calc(100vh-4rem)]
        lg:left-4 lg:top-32 lg:w-64 lg:max-w-none lg:h-auto lg:max-h-[calc(100vh-8rem)]
        overflow-y-auto overflow-x-visible
        ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-y-100 pointer-events-auto'
            : 'opacity-0 -translate-y-2 scale-y-95 max-h-0 pointer-events-none'
        }`}
    >
      <div className="p-2">
        <nav className="overflow-visible">
          <ul className="space-y-1">
            <NavLink
              to="/admin/dashboard"
              pageName="Dashboard"
              onClick={onClose}
              icon={ICONS.Dashboard}
            />
            <ProductMenu onClose={onClose} />
            <NavLink
              to="/admin/orders"
              pageName="Orders"
              onClick={onClose}
              icon={ICONS.Orders}
            />
            <NavLink
              to="/admin/customers"
              pageName="Customers"
              onClick={onClose}
              icon={ICONS.Customers}
            />
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;