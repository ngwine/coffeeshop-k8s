import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "../NavBar/navbar.css";
import { useCart } from "../../contexts/CartContext";
import { useNotifications } from "../../contexts/NotificationContext";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

// Hiển thị thời gian dạng 29/11/2025, 14:32
function formatNotificationTime(value) {
  if (!value) return "";
  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Navbar = () => {
  const DESKTOP_QUERY = "(min-width: 1200px)";
  const [openMenu, setOpenMenu] = useState(false); // desktop dropdown (MENU)
  const [openAccount, setOpenAccount] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile drawer
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(false); // submenu in drawer
  const [searchTerm, setSearchTerm] = useState("");
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(DESKTOP_QUERY).matches
  );
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ===== Notifications context =====
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [openNotifications, setOpenNotifications] = useState(false);

  const { user, loading, logout } = useAuth();
  const { items } = useCart();

  // tổng số lượng trong giỏ
  const cartCount = (items || []).reduce(
    (sum, item) => sum + (item.qty || 0),
    0
  );

  const navigate = useNavigate();
  const accountRef = useRef(null);
  const closeBtnRef = useRef(null); // focus vào nút Close khi mở drawer
  const searchBoxRef = useRef(null);
  const notificationRef = useRef(null);


  // Close account dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setOpenAccount(false);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  // Đóng dropdown notification khi click ra ngoài
useEffect(() => {
  const handleClickOutsideNoti = (e) => {
    if (
      notificationRef.current &&
      !notificationRef.current.contains(e.target)
    ) {
      setOpenNotifications(false);
    }
  const closeDrawer = () => {
  setDrawerOpen(false);
  setOpenNotifications(false);
};
  };

  window.addEventListener("mousedown", handleClickOutsideNoti);
  return () => {
    window.removeEventListener("mousedown", handleClickOutsideNoti);
  };
}, []);


  // cập nhật isDesktop theo resize (>= 992px)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // khi chuyển qua desktop thì tự đóng drawer
  useEffect(() => {
    if (isDesktop && drawerOpen) setDrawerOpen(false);
  }, [isDesktop, drawerOpen]);

  const [categories, setCategories] = useState([]);

  // Mapping slugs to standard labels/names for backward compatibility
  const SLUG_TO_NAME_MAP = {
    "coffee-sets": "Coffee sets",
    "cups-mugs": "Cups & Mugs",
    "roast-coffee": "Roasted coffee",
    "coffee-makers-grinders": "Coffee makers and grinders"
  };

  const slugify = (text) => {
    // Check if we have a hardcoded slug for this exact name
    const entry = Object.entries(SLUG_TO_NAME_MAP).find(([s, n]) => n === text);
    if (entry) return entry[0];

    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // Fetch categories
  useEffect(() => {
    const controller = new AbortController();
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        const list = json.data || [];
        setCategories(list);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Navbar categories error:", err);
        }
      }
    }
    fetchCategories();
    return () => controller.abort();
  }, []);

  // Lấy toàn bộ sản phẩm 1 lần để dùng cho gợi ý search
  useEffect(() => {
    const controller = new AbortController();

    async function fetchAllProducts() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        const list = json.data || json.items || json.products || [];
        setAllProducts(list);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Navbar products error:", err);
        }
      }
    }

    fetchAllProducts();
    return () => controller.abort();
  }, []);

  // Đóng dropdown gợi ý khi click ra ngoài vùng search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // khóa scroll khi mở drawer + ESC để đóng
  useEffect(() => {
    const html = document.documentElement;
    if (drawerOpen) {
      html.style.overflow = "hidden";
      // đẩy focus vào nút close để hỗ trợ keyboard
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    } else {
      html.style.overflow = "";
    }
    const onKey = (e) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setOpenAccount(false);
        setOpenMenu(false);
        setOpenNotifications(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    setOpenAccount(false);
    navigate("/");
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    const keyword = value.trim().toLowerCase();
    if (!keyword) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const matches = allProducts.filter((p) =>
      (p.name || "").toLowerCase().includes(keyword)
    );

    setSuggestions(matches.slice(0, 5)); // giới hạn 5 gợi ý
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (id) => {
    setShowSuggestions(false);
    setSearchTerm("");
    setDrawerOpen(false);
    navigate(`/products/${id}`); // sang trang chi tiết /products/:id
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const value = searchTerm.trim();
    if (!value) return;

    navigate(`/search?q=${encodeURIComponent(value)}`);
    setShowSuggestions(false);
    setDrawerOpen(false);
  };

  // toggle dropdown notification + mark all as read
  const handleToggleNotifications = () => {
    setOpenNotifications((prev) => {
      const next = !prev;
      if (!prev && unreadCount > 0 && typeof markAllRead === "function") {
        markAllRead();
      }
      return next;
    });
  };

  const closeDrawer = () => setDrawerOpen(false);
  const avatarUrl = user?.avatar || user?.avatarUrl || null;

  const safeUnread = Math.max(0, Number.isFinite(Number(unreadCount)) ? Number(unreadCount) : 0);
  const badgeText = safeUnread > 9 ? "9+" : safeUnread;

  return (
    <header className="header">
      <div className="header-container">
        {/* Hamburger chỉ hiện ở mobile */}
        <button
          className="hamburger"
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
          aria-controls="mobile-drawer"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Nav left (Desktop) */}
        <nav className="nav nav-left">
          <ul className="nav-links">
            <li>
              <Link to="/">HOME</Link>
            </li>
            <li>
              <Link to="/about">ABOUT US</Link>
            </li>

            <li
              className="dropdown"
              onMouseEnter={() => isDesktop && setOpenMenu(true)}
              onMouseLeave={() => isDesktop && setOpenMenu(false)}
            >
              {/* với desktop mở bằng hover; mobile dùng drawer bên dưới */}
              <a href="/menu" onClick={(e) => e.preventDefault()}>
                MENU ▾
              </a>
              {openMenu && isDesktop && (
                <ul className="dropdown-menu">
                  {categories.map((cat) => {
                    const name = typeof cat === "string" ? cat : cat.name;
                    return (
                      <li key={name}>
                        <Link to={`/menu/${slugify(name)}`}>{name}</Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>

            <li>
              <Link to="/contact">CONTACT US</Link>
            </li>
          </ul>
        </nav>

        {/* Logo center */}
        <div className="logo">
          <Link to="/">
            <img src="/images/logo.png" alt="logo" />
          </Link>
        </div>

        {/* Nav right: Phone + Search + Notification + Cart + Account */}
        <nav className="nav nav-right">
          <div className="searchBox-wrapper" ref={searchBoxRef}>
            <form className="searchBox" onSubmit={handleSearchSubmit}>
              <input
                className="searchInput"
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchTerm("");
                    setShowSuggestions(false);
                  }
                }}
              />
              <button
                className="searchButton"
                aria-label="Search"
                type="submit"
              >
                <img src="/images/search-icon.svg" alt="Search" />
              </button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <ul className="search-suggestions">
                {suggestions.map((p) => (
                  <li
                    key={p._id || p.id}
                    className="search-suggestion-item"
                    onClick={() => handleSuggestionClick(p._id || p.id)}
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notifications */}
          <div className="notification" ref={notificationRef}>
            <button
              className="notifi-btn"
              aria-label="Notifications"
              type="button"
              onClick={handleToggleNotifications}
            >
              <svg viewBox="0 0 448 512" className="bell" aria-hidden="true">
                <path d="M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96h8c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V200c0-57.4 46.6-104 104-104h8zm64 352H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z"></path>
              </svg>

              {/* badge giống cũ nhưng dùng số unread thật */}
              <span className="cart-badge">{badgeText}</span>
            </button>

            {/* Dropdown thông báo */}
            {/* Dropdown thông báo */}
{openNotifications && (
  <div className="notification-dropdown">
    {!Array.isArray(notifications) || notifications.length === 0 ? (
      <p className="notification-empty">No notifications yet.</p>
    ) : (
      <ul className="notification-list">
        {notifications.map((n, idx) => {
          const title = n.title || n.message || "New notification";
          const message = n.description || n.detail || n.message || "";
          const timeText = formatNotificationTime(
            n.createdAt || n.time || n.timestamp
          );

          return (
            <li
              key={n.id || n._id || n.key || n.createdAt || idx}
              className={
                "notification-item" +
                (n.read ? "" : " notification-item--unread")
              }
            >
              <div className="notification-item-header">
                <span className="notification-title">{title}</span>
                {timeText && (
                  <span className="notification-time">{timeText}</span>
                )}
              </div>

              {message && (
                <p className="notification-message">{message}</p>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </div>
)}

          </div>

          {/* Cart */}
          <Link to="/cart" className="icon-btn" aria-label="Cart">
            <svg viewBox="0 0 24 24" className="cart-icon" aria-hidden="true">
              <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A1.99 1.99 0 0 0 10 19h9v-2h-8.42c-.14 0-.25-.11-.25-.25l.03-.12L11.1 14h6.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 22 5h-15V4zM7 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
            </svg>
            <span className="cart-badge">{cartCount}</span>
          </Link>

          {/* Account dropdown */}
          <div className="dropdown account" ref={accountRef}>
            <button
              type="button"
              className="account-link"
              onClick={() => setOpenAccount((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={openAccount}
              title={user ? user.name || "Account" : "Sign in"}
            >
              {loading ? (
                <span style={{ padding: "0 8px", fontSize: 12 }}>…</span>
              ) : avatarUrl ? (
                <img
                  className="account-avatar"
                  src={avatarUrl}
                  alt="User avatar"
                />
              ) : (
                <svg
                  className="account-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z"
                  />
                </svg>
              )}
              <span className="caret">▾</span>
            </button>

            {openAccount && (
              <ul className="dropdown-menu-right" role="menu">
                {!loading && user ? (
                  <>
                    <li>
                      <Link
                        className="user-item"
                        to="/account"
                        onClick={() => setOpenAccount(false)}
                      >
                        My account
                      </Link>
                    </li>
                    <li>
                      <Link to="/orders">Order history</Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="user-item user-item--logout"
                        onClick={handleLogout}
                      >
                        Sign out
                      </button>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link
                      className="user-item"
                      to="/login"
                      onClick={() => setOpenAccount(false)}
                    >
                      Sign in
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
        </nav>
      </div>

      {/* Backdrop + Drawer cho mobile */}
      <div
        className={`backdrop ${drawerOpen ? "show" : ""}`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />
      <aside
        id="mobile-drawer"
        className={`nav-drawer ${drawerOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="drawer-header">
          <strong>VietRoast</strong>
          <button
            className="drawer-close"
            onClick={closeDrawer}
            aria-label="Close"
            ref={closeBtnRef}
          >
            ×
          </button>
        </div>
        <ul className="drawer-links" role="menu">
          <li role="none">
            <Link role="menuitem" to="/" onClick={closeDrawer}>
              HOME
            </Link>
          </li>
          <li role="none">
            <Link role="menuitem" to="/about" onClick={closeDrawer}>
              ABOUT US
            </Link>
          </li>

          <li className={`accordion ${mobileSubmenuOpen ? "open" : ""}`}>
            <button
              className="accordion-toggle"
              onClick={() => setMobileSubmenuOpen((v) => !v)}
              aria-expanded={mobileSubmenuOpen}
              aria-controls="drawer-submenu"
            >
              MENU ▾<span className="caret">▾</span>
            </button>
            <ul id="drawer-submenu" className="accordion-panel">
              {categories.map((cat) => {
                const name = typeof cat === "string" ? cat : cat.name;
                return (
                  <li key={name}>
                    <Link
                      to={`/menu/${slugify(name)}`}
                      onClick={closeDrawer}
                    >
                      {name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          <li role="none">
            <Link role="menuitem" to="/contact" onClick={closeDrawer}>
              CONTACT US
            </Link>
          </li>
        </ul>
      </aside>
    </header>
  );
};

export default Navbar;
