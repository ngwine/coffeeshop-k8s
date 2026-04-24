import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// Public pages
import HomePage from './pages/Home/HomePage';
import ProductList from './pages/Catalog/ProductList';
import ProductDetail from './pages/Catalog/ProductDetail';
import CartPage from './pages/Cart/CartPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import AuthPage from './pages/Auth/AuthPage';
import AccountPage from './pages/Account/AccountPage';
import OrderHistory from './pages/Orders/OrderHistory';
import OrderDetail from './pages/Orders/OrderDetail';
import AdminApp from './pages/Admin/App.tsx';
import NotFound from './pages/NotFound/NotFound';
import AboutPage from './pages/About/AboutPage';
import ContactPage from './pages/Contact/ContactPage';
import CoffeeSets from './pages/Menu/CoffeeSets';
import CupsMugs from './pages/Menu/CupsMugs';
import RoastCoffee from './pages/Menu/RoastCoffee';
import CoffeeMakersGrinders from './pages/Menu/CoffeeMakersGrinders';
import CategoryMenuPage from './pages/Menu/CategoryMenuPage';
import Navbar from './components/NavBar';
import { CartProvider } from "./contexts/CartContext";
import GoogleCallbackPage from './pages/Auth/GoogleCallbackPage';

function AppShell() {
  const location = useLocation();
  const hideNavbar =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/products') ||
    location.pathname.startsWith('/product/');

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:categoryId" element={<ProductList />} />
        <Route path="/product/:productId" element={<ProductDetail />} />
        <Route path="/products/:id" element={<ProductDetail />} />


        {/* Cart & Checkout */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Auth & Account */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/about" element={<AboutPage />} />

        
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

        {/* Contact */}
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/menu/:categorySlug" element={<CategoryMenuPage/>} />

        {/* Orders */}
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/orders/:orderId" element={<OrderDetail />} />

        {/* Admin */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </Router>
  );
}
