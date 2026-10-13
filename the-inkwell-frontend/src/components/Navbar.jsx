import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getDashboardPath } from "../context/authUtils";
import { useCart } from "../context/useCart";
import { getBookImageUrl } from "../utils/book";
import { FiShoppingCart, FiX, FiPlus, FiMinus, FiTrash2, FiAlertTriangle } from "react-icons/fi";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Navbar({
  mode = "public", // 'public' | 'dashboard'
  badgeText = "",  // e.g. 'Admin', 'Store', 'Employee'
  hideDashboardButton = false,
  hideSearch = false
}) {
  const { user, login, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { cartItems, cartCount, cartTotal, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isPublic = mode === "public";

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-center items-center px-8 py-4 bg-primary/90 backdrop-blur-md shadow-elevation-1">
      <div className="flex items-center gap-12 max-w-7xl w-full justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="font-display font-bold text-3xl text-on-primary tracking-tight flex items-center gap-2">
            <span>The<span className="italic text-surface opacity-60 font-medium ml-1">Inkwell.</span></span>
            {badgeText && (
              <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold bg-white/20 text-on-primary px-3 py-1 rounded-sm">
                {badgeText}
              </span>
            )}
          </Link>
          {isPublic && (
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-on-primary font-bold border-b-2 border-on-primary pb-1 label-md hover:-translate-y-0.5 transition-all duration-300">Browse</Link>
              <Link to="/collections" className="text-on-primary/70 font-medium label-md hover:text-on-primary hover:-translate-y-0.5 transition-all duration-300">Collections</Link>
              <Link to="/stores" className="text-on-primary/70 font-medium label-md hover:text-on-primary hover:-translate-y-0.5 transition-all duration-300">Stores</Link>
              <Link to="/membership" className="text-on-primary/70 font-medium label-md hover:text-on-primary hover:-translate-y-0.5 transition-all duration-300">Membership</Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-6">
          {isPublic && !hideSearch && (
            <form onSubmit={handleSearch} className="relative hidden lg:block">
              <input
                type="text"
                placeholder="Search by author, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-b-2 border-on-primary/30 focus:border-on-primary focus:ring-0 px-4 py-2 w-64 body-md text-on-primary outline-none transition-colors duration-300 placeholder-on-primary/50"
              />
              <button type="submit" className="absolute right-2 top-2 text-on-primary/50 hover:text-on-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </button>
            </form>
          )}

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {isPublic && !hideDashboardButton && (
                  <button
                    type="button"
                    onClick={() => navigate(getDashboardPath(user?.roles || []))}
                    className="hidden md:inline-flex items-center gap-2 px-4 py-2 border border-on-primary text-on-primary label-md rounded-sm hover:bg-on-primary hover:text-primary transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    My Dashboard
                  </button>
                )}
                <div className="hidden md:flex flex-col leading-tight items-end">
                  <span className="label-md text-on-primary">{user.name}</span>
                  <button onClick={logout} className="caption text-on-primary/70 hover:text-on-primary hover:underline">Logout</button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="relative cursor-pointer w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-on-primary flex items-center justify-center bg-on-primary text-primary font-bold text-sm select-none"
                >
                  {getInitials(user.name)}
                </button>
              </>
            ) : (
              <>
                <button onClick={login} className="text-on-primary/80 font-bold label-md hover:text-on-primary transition-colors">Log In</button>
                <button onClick={() => navigate("/register")} className="px-6 py-2.5 bg-on-primary text-primary label-md rounded-md hover:bg-white hover:shadow-elevation-2 transition-all duration-300 shadow-elevation-1">Sign Up</button>
              </>
            )}
            {isPublic && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-on-primary/80 hover:text-on-primary hover:bg-white/10 rounded-lg transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="w-full max-w-md bg-background h-screen shadow-elevation-3 flex flex-col border-l border-surface-variant animate-slide-in text-on-surface"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="font-display font-semibold text-lg text-primary flex items-center gap-2">
                  <FiShoppingCart /> Your Cart
                </h3>
                <p className="body-md text-secondary mt-1">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-variant"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-secondary">
                  <FiShoppingCart size={48} className="stroke-1 opacity-60" />
                  <div>
                    <p className="font-display font-semibold text-base text-primary">Your cart is empty</p>
                    <p className="body-md text-secondary mt-1">Add books to your cart to see them here.</p>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="btn-primary mt-2 px-6 py-2 label-md"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border border-surface-variant bg-surface-container-lowest hover:border-primary-container transition-colors rounded-sm"
                  >
                    {/* Thumbnail */}
                    <img
                      src={getBookImageUrl(item) || "https://placehold.co/48x68?text=Book"}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded-sm flex-shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="body-md font-semibold text-primary truncate leading-tight">
                          {item.title}
                        </h4>
                        <p className="caption text-secondary mt-0.5 truncate font-sans">
                          by {item.author}
                        </p>
                        {item.branchId && (
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 border border-outline-variant bg-surface text-secondary rounded-sm font-sans">
                            Branch: {item.branchId.slice(0, 8)}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls + Price */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-variant">
                        <div className="flex items-center border border-outline-variant rounded-sm bg-surface">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 text-secondary hover:text-primary transition-colors"
                          >
                            <FiMinus size={12} />
                          </button>
                          <span className="px-2 text-xs font-semibold text-primary">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-secondary hover:text-primary transition-colors"
                          >
                            <FiPlus size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="body-md font-bold text-primary font-mono">
                            ETB {item.price * item.quantity}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-secondary hover:text-error transition-colors"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-surface-variant bg-surface-container-lowest flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="body-lg font-bold text-secondary">Subtotal</span>
                  <span className="headline-sm text-primary font-bold font-mono">ETB {cartTotal}</span>
                </div>
                <p className="text-[11px] text-secondary leading-normal flex items-start gap-1 font-sans">
                  <FiAlertTriangle className="flex-shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    If items are from different branches, they will be split into separate orders at checkout.
                  </span>
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate("/checkout");
                  }}
                  className="w-full btn-primary py-3.5 label-md flex items-center justify-center gap-2 bg-primary border-primary hover:opacity-90"
                >
                  <FiShoppingCart /> Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
