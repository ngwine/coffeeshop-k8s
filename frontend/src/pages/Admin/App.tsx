import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/dashboard/Dashboard';
import Products from './pages/products/Products';
import Orders from './pages/orders/Orders';
import Customers from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import AddCustomer from './pages/customers/AddCustomer';
import AddProduct from './pages/products/AddProduct/AddProductPage';
import CategoryList from './pages/products/category/CategoryList';
import ProductDetail from './pages/products/ProductDetail/ProductDetail';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Route protection: chỉ cho phép admin đã đăng nhập
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Chưa đăng nhập → redirect về login
        navigate('/login', { state: { from: { pathname: '/admin' } } });
      } else if (user.role !== 'admin') {
        // Đã đăng nhập nhưng không phải admin → redirect về home
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [productsRefreshTrigger, setProductsRefreshTrigger] = useState(0);

  // Hiển thị loading hoặc không hiển thị gì khi đang kiểm tra auth
  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="admin-panel-root flex min-h-screen bg-background-dark text-text-primary items-center justify-center">
        <div className="text-center">
          <p className="text-text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-root flex min-h-screen bg-background-dark text-text-primary relative">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      {/* Row 1: Header with logo and controls */}
      <div className="fixed left-0 right-0 top-0 h-14 md:h-16 z-50">
        <Header
          logoUrl="/images/logo.png"
          onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
        />
      </div>
      
      <button
        className="hidden lg:flex fixed z-40 p-2 md:p-3 rounded-md bg-background-light border border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors
          top-16 md:top-20 left-4"
        aria-label="Toggle sidebar"
        onClick={(e) => {
          e.stopPropagation();
          setIsSidebarOpen((o) => !o);
        }}
      >
        <span className="sr-only">Toggle menu</span>
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

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content - URL Based Routing */}
      <div className={`flex-1 flex flex-col pt-14 md:pt-16 pb-4 md:pb-8 lg:pl-72 overflow-x-hidden max-w-full`}>
        <div className="flex-1 p-3 md:p-4 lg:p-6 xl:p-8 min-w-0 max-w-full overflow-x-hidden">
          <Routes>
            {/* Dashboard */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Products Routing */}
            <Route path="products">
              <Route index element={
                 <Products
                    setActivePage={(page) => {
                       if (page === 'Product List') navigate('/admin/products');
                       else if (page === 'Add Product') navigate('/admin/products/add');
                       else if (page === 'Category List') navigate('/admin/categories');
                    }}
                    selectedCategory={searchParams.get('category')}
                    onClearSelectedCategory={() => {
                        searchParams.delete('category');
                        navigate({ search: searchParams.toString() });
                    }}
                    refreshTrigger={productsRefreshTrigger}
                    onProductClick={(product) => {
                      const id = (product as any)?._id || (product as any)?.id || product.id;
                      navigate(`/admin/products/${id}`);
                    }}
                  />
              } />
              <Route path="add" element={
                <AddProduct 
                  onBack={() => {
                    setProductsRefreshTrigger(prev => prev + 1);
                    navigate('/admin/products');
                  }} 
                  setActivePage={(page) => {
                    if (page === 'Product List') navigate('/admin/products');
                  }} 
                />
              } />
              <Route path=":productId" element={
                 <ProductDetail
                    productId={null}
                    onBack={() => {
                      setProductsRefreshTrigger(prev => prev + 1);
                      navigate('/admin/products');
                    }}
                  />
              } />
            </Route>

            {/* Categories */}
            <Route path="categories" element={
               <CategoryList 
                  setActivePage={() => navigate('/admin/products')}
                  onCategoryClick={(categoryName) => {
                    navigate(`/admin/products?category=${encodeURIComponent(categoryName)}`);
                  }}
                />
            } />

            {/* Orders */}
            <Route path="orders" element={<Orders onOrderClose={() => navigate('/admin/orders')} />} />
            <Route path="orders/:orderId" element={<Orders onOrderClose={() => navigate('/admin/orders')} />} />

            {/* Customers */}
            <Route path="customers">
               <Route index element={
                 <Customers 
                    onSelectCustomer={(id) => navigate(`/admin/customers/${id}`)}
                    setActivePage={(page) => {
                      if (page === 'Add Customer') navigate('/admin/customers/add');
                    }}
                 />
               } />
               <Route path="add" element={<AddCustomer onBack={() => navigate('/admin/customers')} setActivePage={() => {}} />} />
               <Route path=":customerId" element={<CustomerDetail customerId={null} onBack={() => navigate('/admin/customers')} onOrderClick={(id) => navigate(`/admin/orders/${id}`)} />} />
            </Route>

            {/* 404 Fallback in Admin */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;