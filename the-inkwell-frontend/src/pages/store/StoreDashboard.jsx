import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosInstance";
import { unwrapItem, unwrapList } from "../../utils/apiHelpers";
import { getBookDocumentUrl, getBookImageUrl } from "../../utils/book";
import {
  FiPieChart, FiBook, FiBox, FiHome, FiUsers, FiTrendingUp, FiSettings,
  FiGlobe, FiStar, FiMapPin, FiPhone, FiDollarSign, FiUser,
  FiClock, FiCheck, FiExternalLink, FiAlertCircle, FiCheckCircle, FiPercent,
  FiX, FiLock, FiCreditCard, FiZap, FiAlertTriangle, FiCalendar
} from "react-icons/fi";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDanger = false }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-background border border-surface-variant shadow-elevation-3 p-8 w-full max-w-sm rounded-sm">
        <h3 className="headline-md text-primary mb-4">{title}</h3>
        <p className="body-md text-secondary mb-8">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary py-3 label-md hover:border-primary hover:text-primary transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 label-md border transition-colors ${isDanger
              ? "btn-secondary text-error border-error/30 hover:bg-error/5"
              : "btn-primary hover:bg-white hover:text-primary hover:border-2 border-primary"
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-surface-container-lowest border border-surface-variant p-6 shadow-elevation-1 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-2xl flex-shrink-0 bg-surface-variant`}>
        {icon}
      </div>
      <div>
        <p className="text-secondary label-md uppercase tracking-wider">{label}</p>
        <p className="text-primary font-bold headline-sm mt-1">{value}</p>
        {sub && <p className="text-secondary body-md mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function StoreSidebar({ store, activeTab, setActiveTab, navigate }) {
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  // null = checking, true = complete, false = incomplete
  const [onboardingComplete, setOnboardingComplete] = useState(null);

  useEffect(() => {
    // Live-check onboarding status: this endpoint re-checks Stripe directly, so it doesn't
    // depend on the account.updated webhook (which can't reach localhost) having fired.
    const refreshStatus = () => {
      api.get("/payments/store/onboarding-status")
        .then((res) => {
          // Support { data: true }, { data: { data: true } }, or a plain boolean
          const val = res.data?.data ?? res.data;
          setOnboardingComplete(val === true);
        })
        .catch(() => setOnboardingComplete(false));
    };

    refreshStatus();

    // Re-check when the user returns to the tab (e.g. right after finishing Stripe onboarding)
    const onFocus = () => refreshStatus();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshStatus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const NAV = [
    { id: "overview", icon: <FiPieChart />, label: "Dashboard" },
    { id: "books", icon: <FiBook />, label: "Inventory" },
    { id: "orders", icon: <FiBox />, label: "Orders" },
    { id: "branches", icon: <FiHome />, label: "Branches" },
    { id: "employees", icon: <FiUsers />, label: "Staff" },
    { id: "earnings", icon: <FiTrendingUp />, label: "Analytics" },
    { id: "settings", icon: <FiSettings />, label: "Settings" },
  ];

  const handleStripeLogin = async () => {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const res = await api.post("/payments/store/dashboard-link");
      const url = res.data?.data?.url || res.data?.data || res.data?.url || res.data;
      if (url && typeof url === "string") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setStripeError("Could not retrieve dashboard link.");
      }
    } catch (err) {
      console.error("Failed to get Stripe dashboard link", err);
      setStripeError("Failed to open Stripe dashboard.");
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <aside className="w-64 bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-6 flex flex-col gap-2 sticky top-28 self-start">
      {/* Store identity */}
      <div className="pb-6 mb-4 border-b border-surface-variant">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-outline-variant bg-surface flex items-center justify-center text-xl">
            <FiHome />
          </div>
          <div className="min-w-0">
            <p className="display-sm text-primary truncate">
              {store?.storeName || "My Store"}
            </p>
            <span className={`label-md px-2 py-0.5 mt-1 inline-block border ${store?.plan === "PREMIUM"
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-variant text-secondary border-outline-variant"
              }`}>
              {store?.plan || "FREE"} Plan
            </span>
          </div>
        </div>
        {/* Verification badge */}
        <div className={`mt-4 flex items-center gap-2 label-md ${store?.verificationStatus === "APPROVED"
          ? "text-primary" : "text-secondary"
          }`}>
          <span className="flex items-center">{store?.verificationStatus === "APPROVED" ? <FiCheck /> : <FiClock />}</span>
          <span>{store?.verificationStatus || "PENDING"}</span>
        </div>
      </div>

      {/* Nav items */}
      {NAV.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex items-center gap-4 px-4 py-3 text-left transition-colors border-l-2 ${activeTab === item.id
            ? "border-primary bg-primary text-on-primary font-bold label-md"
            : "border-transparent text-secondary hover:bg-surface-variant hover:text-primary label-md"
            }`}
        >
          <span className="text-xl">{item.icon}</span>
          {item.label}
        </button>
      ))}

      {/* Bottom — stripe + view store */}
      <div className="mt-auto pt-6 border-t border-surface-variant flex flex-col gap-3">
        {/* Onboarding status — show appropriate button */}
        {onboardingComplete === null ? (
          /* Still checking — subtle skeleton */
          <div className="w-full h-11 bg-surface-variant animate-pulse" />
        ) : onboardingComplete ? (
          /* Onboarding done — show Stripe Dashboard */
          <>
            <button
              id="stripe-dashboard-btn"
              onClick={handleStripeLogin}
              disabled={stripeLoading}
              className="w-full flex items-center gap-3 px-4 py-3 label-md bg-[#635BFF] text-white hover:bg-[#4f47d6] disabled:opacity-60 transition-colors border border-[#635BFF] hover:border-[#4f47d6]"
            >
              <span className="text-lg">
                {stripeLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiExternalLink />
                )}
              </span>
              {stripeLoading ? "Opening..." : "Stripe Dashboard"}
            </button>
            {stripeError && (
              <p className="label-md text-error px-1">{stripeError}</p>
            )}
          </>
        ) : (
          /* Onboarding incomplete — prompt to finish */
          <button
            id="complete-onboarding-btn"
            onClick={() => navigate("/onbording/retry")}
            className="w-full flex items-center gap-3 px-4 py-3 label-md bg-warning/10 text-warning border border-warning/40 hover:bg-warning/20 hover:border-warning transition-colors"
          >
            <span className="text-lg"><FiAlertCircle /></span>
            Complete Onboarding
          </button>
        )}

        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-4 py-3 label-md text-secondary hover:bg-surface-variant hover:text-primary transition-colors border border-outline-variant hover:border-primary"
        >
          <span><FiGlobe /></span> View Public Store
        </button>
      </div>
    </aside>
  );
}

function OverviewTab({ store, branches, stats, onUpgrade, subscription }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="display-sm text-primary mb-2">Dashboard</h2>
        <p className="body-lg text-secondary">A scholarly look at your literary ecosystem's health.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest border border-surface-variant p-6 shadow-elevation-1">
          <p className="label-md text-secondary uppercase tracking-wider mb-2">Total Revenue</p>
          <p className="display-sm text-primary truncate">ETB {(stats?.revenue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-surface-container-lowest border border-surface-variant p-6 shadow-elevation-1">
          <p className="label-md text-secondary uppercase tracking-wider mb-2">Active Orders</p>
          <p className="display-sm text-primary truncate">{stats?.totalOrders || 0}</p>
        </div>
        <div className="bg-surface-container-lowest border border-surface-variant p-6 shadow-elevation-1">
          <p className="label-md text-secondary uppercase tracking-wider mb-2">Stock Level</p>
          <p className="display-sm text-primary truncate">{stats?.totalBooks || 0} Titles</p>
        </div>
      </div>

      {/* Branches summary */}
      <div className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-surface-variant pb-4 gap-4">
          <h3 className="headline-md text-primary">Branch Performance</h3>
          <p className="body-md text-secondary">Comparative sales volume for the current fiscal week.</p>
        </div>
        {branches.length === 0 ? (
          <p className="body-md text-secondary text-center py-8">No branches yet</p>
        ) : (
          <div className="flex flex-col gap-4">
            {branches.map((branch, i) => (
              <div key={branch.id} className="flex items-center gap-6 p-4 border border-outline-variant bg-surface hover:border-primary transition-colors">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center label-md font-bold text-primary flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="headline-sm text-primary truncate">{branch.branchName}</p>
                  <p className="body-md text-secondary">{branch.city}, {branch.region}</p>
                </div>
                <div className="text-right">
                  <p className="headline-sm text-primary">
                    ETB {(branch.revenue || 0).toLocaleString()}
                  </p>
                  <p className="body-md text-secondary">{branch.orderCount || 0} orders</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan info */}
      <div className={`p-8 flex items-center gap-6 border shadow-elevation-1 ${
        store?.plan === "PREMIUM"
          ? "bg-primary/5 border-primary"
          : "bg-surface-container-lowest border-outline-variant"
        }`}>
        <span className="text-4xl text-primary">{store?.plan === "PREMIUM" ? <FiStar /> : <FiBox />}</span>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <p className="headline-md text-primary">
              {store?.plan === "PREMIUM" ? "Premium Plan" : "Free Plan"}
            </p>
            {store?.plan === "PREMIUM" && subscription?.cancelAtPeriodEnd && (
              <span className="label-sm px-2 py-0.5 border border-amber-400 bg-amber-50 text-amber-700">
                Cancels {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "at period end"}
              </span>
            )}
          </div>
          <p className="body-lg text-secondary">
            {store?.plan === "PREMIUM"
              ? "2% commission per sale · Priority support · Advanced analytics"
              : "5% commission per sale · Standard support · Basic analytics"}
          </p>
        </div>
        {store?.plan !== "PREMIUM" && (
          <button
            onClick={onUpgrade}
            className="btn-primary px-8 py-3 label-md whitespace-nowrap flex items-center gap-2"
          >
            <FiZap /> Upgrade to Premium
          </button>
        )}
      </div>
    </div>
  );
}

function BranchesTab({ branches, setBranches }) {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    branchName: "", region: "", city: "", address: "", phone: "",
  });

  const REGIONS = [
    "Addis Ababa", "Oromia", "Amhara", "Tigray",
    "SNNPR", "Somali", "Afar", "Benishangul-Gumuz", "Gambela", "Harari", "Dire Dawa",
  ];

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/stores/me/branch`, form);
      const newBranch = unwrapItem(res);
      setBranches((prev) => [...prev, { ...newBranch, bookCount: 0, orderCount: 0 }]);
      setShowAdd(false);
      setForm({ branchName: "", region: "", city: "", address: "", phone: "" });
    } catch (err) {
      console.error("Failed to add branch", err);
    }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-surface-variant pb-6">
        <h2 className="display-sm text-primary">Branches</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="btn-primary px-6 py-3 label-md"
        >
          + Add Branch
        </button>
      </div>

      {/* Add branch form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-8 flex flex-col gap-6">
          <h3 className="headline-md text-primary">New Branch details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { key: "branchName", label: "Branch Name", placeholder: "e.g. Bole Branch" },
              { key: "phone", label: "Phone", placeholder: "+251 ..." },
              { key: "city", label: "City / Woreda", placeholder: "e.g. Bole" },
              { key: "address", label: "Specific Address", placeholder: "Street, building..." },
            ].map((f) => (
              <div key={f.key}>
                <label className="block label-md text-secondary uppercase tracking-wider mb-2">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary body-md text-primary outline-none transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block label-md text-secondary uppercase tracking-wider mb-2">
                Region
              </label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary body-md text-primary outline-none transition-colors"
              >
                <option value="">Select region...</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 py-3 label-md disabled:opacity-60"
            >
              {loading ? "Adding..." : "Save Branch"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="btn-secondary px-8 py-3 label-md"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Branch cards */}
      {branches.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-variant p-16 text-center shadow-elevation-1">
          <p className="text-5xl mb-6 opacity-80 flex justify-center"><FiHome /></p>
          <p className="headline-md text-primary">No branches yet</p>
          <p className="body-lg text-secondary mt-2">Add your first branch to start listing books</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-8 flex flex-col gap-6">
              <div className="flex items-start justify-between border-b border-surface-variant pb-4">
                <div>
                  <p className="display-sm text-primary">{branch.branchName}</p>
                  <p className="body-md text-secondary mt-1">
                    {branch.city}, {branch.region}
                  </p>
                </div>
                <span className="bg-primary/10 border border-primary text-primary label-md px-3 py-1 uppercase tracking-wider">
                  Active
                </span>
              </div>
              <div className="flex flex-col gap-2 body-md text-secondary">
                <p className="flex items-center gap-2"><FiMapPin /> {branch.address}</p>
                <p className="flex items-center gap-2"><FiPhone /> {branch.phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-variant">
                <div className="bg-surface p-4 border border-outline-variant text-center">
                  <p className="headline-md text-primary">{branch.bookCount || 0}</p>
                  <p className="label-md text-secondary uppercase tracking-wider">Books</p>
                </div>
                <div className="bg-surface p-4 border border-outline-variant text-center">
                  <p className="headline-md text-primary">{branch.orderCount || 0}</p>
                  <p className="label-md text-secondary uppercase tracking-wider">Orders</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BooksTab({ branches }) {
  const [booksByBranch, setBooksByBranch] = useState([]);  // [{branch, books}]
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [files, setFiles] = useState({ imageFile: null, documentFile: null });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    onConfirm: null,
    isDanger: false
  });

  const showConfirm = ({ title, message, confirmText, onConfirm, isDanger = false }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
      isDanger
    });
  };

  const closeConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const [form, setForm] = useState({
    title: "", author: "", category: "", price: "",
    condition: "NEW", branchId: "",
  });

  const CATEGORIES = [
    "Technology", "Fiction", "Business", "Science", "Philosophy", "Biography", "Religion", "Education", "Other"
  ];

  useEffect(() => {
    if (!branches.length) return;
    Promise.all(
      branches.map((branch) =>
        api.get(`/books/store/branch/${branch.id}`)
          .then((r) => ({ branch, books: unwrapList(r) }))
          .catch(() => ({ branch, books: [] }))
      )
    ).then((results) => {
      setBooksByBranch(results);
    }).finally(() => setLoading(false));
  }, [branches]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const formData = new FormData();
      const bookData = { ...form, price: parseFloat(form.price) };
      formData.append("data", new Blob([JSON.stringify(bookData)], { type: "application/json" }));
      if (files.imageFile) formData.append("image", files.imageFile);
      if (files.documentFile) formData.append("documentFile", files.documentFile);

      const res = await api.post(`/books/store/branch/${form.branchId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const newBook = unwrapItem(res);
      setBooksByBranch((prev) =>
        prev.map((g) =>
          g.branch.id === form.branchId ? { ...g, books: [newBook, ...g.books] } : g
        )
      );
      setShowAdd(false);
      setForm({ title: "", author: "", category: "", price: "", condition: "NEW", branchId: "" });
      setFiles({ imageFile: null, documentFile: null });
    } catch (err) {
      console.error("Failed to add book", err);
    } finally { setAddLoading(false); }
  };

  const handleCancelAdd = () => {
    setShowAdd(false);
    setFiles({ imageFile: null, documentFile: null });
  };

  const handleDelete = (bookId) => {
    showConfirm({
      title: "Delete Book Title",
      message: "Are you sure you want to permanently delete this book title? This action cannot be undone.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/books/${bookId}`);
          setBooksByBranch((prev) =>
            prev.map((g) => ({ ...g, books: g.books.filter((b) => b.id !== bookId) }))
          );
        } catch (err) {
          console.error("Failed to delete book", err);
        }
      }
    });
  };

  const handleApprove = (bookId) => {
    showConfirm({
      title: "Approve Book",
      message: "Are you sure you want to approve this book title?",
      confirmText: "Approve",
      isDanger: false,
      onConfirm: async () => {
        try {
          await api.put(`/books/store/${bookId}/approve`);
          setBooksByBranch((prev) =>
            prev.map((g) => ({
              ...g,
              books: g.books.map((b) => b.id === bookId ? { ...b, approved: true, status: "APPROVED" } : b),
            }))
          );
        } catch (err) {
          console.error("Failed to approve book", err);
        }
      }
    });
  };

  const handleReject = async (bookId) => {
    try {
      await api.put(`/books/store/${bookId}/reject`);
      setBooksByBranch((prev) =>
        prev.map((g) => ({
          ...g,
          books: g.books.map((b) => b.id === bookId ? { ...b, approved: false, status: "REJECTED" } : b),
        }))
      );
    } catch (err) {
      console.error("Failed to reject book", err);
    }
  };

  // Filter per-branch grouped data
  const filteredByBranch = booksByBranch.map((g) => ({
    ...g,
    books: g.books.filter((book) => {
      if (filterStatus === "ALL") return true;
      const status = book.status ? book.status.toUpperCase() : (book.approved ? "APPROVED" : "PENDING");
      return status === filterStatus;
    }),
  })).filter((g) => g.books.length > 0 || filterStatus === "ALL");

  // Also keep a flat list to check if there are any books at all
  const hasAnyBooks = booksByBranch.some((g) => g.books.length > 0);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-variant pb-6 gap-4">
        <h2 className="display-sm text-primary">Books Archive</h2>
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-auto px-4 py-3 pr-8 bg-surface border border-outline-variant text-primary label-md outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Add book form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-8 flex flex-col gap-6">
          <h3 className="headline-md text-primary">New Title Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { key: "title", label: "Title", placeholder: "Book title" },
              { key: "author", label: "Author", placeholder: "Author name" },
              { key: "price", label: "Price (ETB)", placeholder: "e.g. 350", type: "number" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block label-md text-secondary uppercase tracking-wider mb-2">
                  {f.label}
                </label>
                <input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary body-md text-primary outline-none transition-colors"
                />
              </div>
            ))}

            {/* Category */}
            <div>
              <label className="block label-md text-secondary uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="appearance-auto w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary body-md text-primary outline-none transition-colors"
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block label-md text-secondary uppercase tracking-wider mb-2">
                Condition
              </label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="appearance-auto w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary body-md text-primary outline-none transition-colors"
              >
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>


          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                key: "imageFile",
                label: "Cover Art",
                accept: "image/*",
                hint: "Upload a JPG, PNG, or WEBP cover image",
              },
              {
                key: "documentFile",
                label: "Manuscript (PDF/Doc)",
                accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                hint: "Upload the book PDF or document file",
              },
            ].map((f) => (
              <label
                key={f.key}
                className="border border-dashed border-outline-variant bg-surface hover:border-primary p-6 transition-colors cursor-pointer text-center"
              >
                <span className="block label-md text-primary uppercase tracking-wider mb-2">
                  {f.label}
                </span>
                <span className="block body-md text-secondary mb-4">
                  {files[f.key] ? files[f.key].name : f.hint}
                </span>
                <span className="btn-secondary px-6 py-2 label-md inline-block">
                  {files[f.key] ? "Change File" : "Choose File"}
                </span>
                <input
                  type="file"
                  accept={f.accept}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFiles((prev) => ({ ...prev, [f.key]: file }));
                  }}
                  className="hidden"
                />
              </label>
            ))}
          </div>

          <div className="flex gap-4 mt-4 border-t border-surface-variant pt-6">
            <button
              type="submit"
              disabled={addLoading}
              className="btn-primary px-8 py-3 label-md disabled:opacity-60"
            >
              {addLoading ? "Saving..." : "Save Title"}
            </button>
            <button
              type="button"
              onClick={handleCancelAdd}
              className="btn-secondary px-8 py-3 label-md"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Books grouped by branch */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest border border-surface-variant h-20 animate-pulse" />
          ))}
        </div>
      ) : !hasAnyBooks ? (
        <div className="bg-surface-container-lowest border border-surface-variant p-16 text-center shadow-elevation-1">
          <p className="text-5xl mb-6 opacity-80 flex justify-center"><FiBook /></p>
          <p className="headline-md text-primary">No titles curated yet</p>
          <p className="body-lg text-secondary mt-2">Add your first book to start selling</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {filteredByBranch.map(({ branch, books: branchBooks }) => (
            <div key={branch.id}>
              {/* Branch header */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-primary/20">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary label-md font-bold flex-shrink-0">
                  <FiHome />
                </div>
                <div className="flex-1">
                  <h3 className="headline-md text-primary">{branch.branchName}</h3>
                  <p className="body-md text-secondary">{branch.city}, {branch.region} · {branchBooks.length} title{branchBooks.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => {
                    setForm({ ...form, branchId: branch.id });
                    setShowAdd(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="btn-primary px-4 py-2 label-md hover:bg-white hover:text-primary hover:border-2 border-primary transition-colors"
                >
                  + Add Title
                </button>
              </div>

              {branchBooks.length === 0 ? (
                <p className="body-md text-secondary italic pl-2">No books match this filter for this branch.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {branchBooks.map((book) => (
                    <div key={book.id} className="bg-surface-container-lowest border border-surface-variant p-6 shadow-elevation-1 flex flex-col gap-4 group hover:border-primary transition-colors">
                      <div className="flex gap-4">
                        {getBookImageUrl(book) ? (
                          <img src={getBookImageUrl(book)} alt={book.title} className="w-20 h-28 object-cover border border-outline-variant flex-shrink-0" />
                        ) : (
                          <div className="w-20 h-28 bg-surface-variant border border-outline-variant flex items-center justify-center text-secondary flex-shrink-0 text-3xl">
                            <FiBook />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="headline-sm text-primary line-clamp-2" title={book.title}>{book.title}</p>
                          <p className="body-md text-secondary mt-1 truncate" title={book.author}>{book.author}</p>
                          <p className="headline-sm text-primary mt-3">ETB {book.price}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-surface-variant pt-4 mt-2">
                        <div>
                          <p className="label-md text-secondary uppercase tracking-wider">Category</p>
                          <p className="body-md text-primary mt-1">{book.category}</p>
                        </div>
                        <div>
                          <p className="label-md text-secondary uppercase tracking-wider">Condition</p>
                          <span className={`inline-block mt-1 label-md uppercase tracking-wider px-2 py-0.5 border ${book.condition === "NEW" ? "bg-primary/5 text-primary border-primary" : "bg-surface text-secondary border-outline-variant"}`}>
                            {book.condition}
                          </span>
                        </div>
                        <div>
                          <p className="label-md text-secondary uppercase tracking-wider">Document</p>
                          {getBookDocumentUrl(book) ? (
                            <a href={getBookDocumentUrl(book)} target="_blank" rel="noreferrer" className="inline-block mt-1 label-md text-primary hover:underline uppercase tracking-wider">
                              View
                            </a>
                          ) : (
                            <span className="inline-block mt-1 body-md text-secondary">None</span>
                          )}
                        </div>
                        <div>
                          <p className="label-md text-secondary uppercase tracking-wider">Status</p>
                          <span className={`inline-block mt-1 label-md uppercase tracking-wider px-2 py-0.5 border ${(book.status === "APPROVED" || (!book.status && book.approved)) ? "bg-primary/5 text-primary border-primary" :
                            book.status === "REJECTED" ? "bg-error/5 text-error border-error" :
                              "bg-surface text-secondary border-outline-variant"
                            }`}>
                            {book.status ? book.status : (book.approved ? "APPROVED" : "PENDING")}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-surface-variant flex flex-col gap-2">
                        {((book.status && book.status.toUpperCase() === "PENDING") || (!book.status && !book.approved)) && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(book.id)}
                              className="flex-1 btn-primary py-2 label-md hover:bg-white hover:text-primary hover:border-2 border-primary"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(book.id)}
                              className="flex-1 btn-secondary py-2 label-md text-error hover:border-error hover:bg-error/5 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="w-full btn-secondary py-2 label-md text-error hover:border-error hover:bg-error/5 transition-colors"
                        >
                          Delete Title
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {confirmModal.isOpen && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          onConfirm={confirmModal.onConfirm}
          onCancel={closeConfirm}
          isDanger={confirmModal.isDanger}
        />
      )}
    </div>
  );
}

function EarningsTab({ store, orders = [], branches = [] }) {
  const commission = store?.plan === "PREMIUM" ? 2 : 5;
  const commissionMultiplier = store?.plan === "PREMIUM" ? 0.98 : 0.95;

  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) * commissionMultiplier;

  // Branch map helper to show branch names
  const branchMap = branches.reduce((acc, b) => {
    acc[b.id] = b.branchName;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-surface-variant pb-6">
        <h2 className="display-sm text-primary">Analytics Overview</h2>
        <p className="body-lg text-secondary mt-2">Monitor net earnings, commission rates, and order fulfillment status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon={<FiDollarSign />} label="Net Revenue" value={`ETB ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <StatCard icon={<FiCheckCircle />} label="Delivered Orders" value={`${deliveredOrders.length}`} />
        <StatCard icon={<FiPercent />} label="Commission Rate" value={`${commission}%`} sub={`${store?.plan || "FREE"} plan`} />
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-8">
        <h3 className="headline-md text-primary mb-6 border-b border-surface-variant pb-4">Delivered Orders History</h3>
        {deliveredOrders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-6 opacity-80 flex justify-center text-secondary"><FiPieChart /></p>
            <p className="headline-md text-primary">No delivered orders yet</p>
            <p className="body-lg text-secondary mt-2">When customer orders are fulfilled and delivered, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-variant label-md text-secondary">
                  <th className="py-4 font-semibold">Order ID</th>
                  <th className="py-4 font-semibold">Date</th>
                  <th className="py-4 font-semibold">Branch</th>
                  <th className="py-4 font-semibold text-right">Gross Price</th>
                  <th className="py-4 font-semibold text-right">Payout (Net)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant body-md text-primary">
                {deliveredOrders.map((o) => {
                  const gross = o.totalPrice || 0;
                  const net = gross * commissionMultiplier;
                  const dateFormatted = o.createdAt
                    ? new Date(o.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A";
                  return (
                    <tr key={o.id} className="hover:bg-surface-variant/10 transition-colors">
                      <td className="py-4 font-mono text-sm tracking-wider text-secondary">
                        {o.id.substring(0, 8)}...
                      </td>
                      <td className="py-4">{dateFormatted}</td>
                      <td className="py-4">{branchMap[o.branchId] || "Unknown Branch"}</td>
                      <td className="py-4 text-right">ETB {gross.toFixed(2)}</td>
                      <td className="py-4 text-right font-semibold text-primary">ETB {net.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmployeesTab({ branches }) {
  const [employeesByBranch, setEmployeesByBranch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    role: "WORKER",
    branchId: "",
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showInviteForBranchId, setShowInviteForBranchId] = useState(null);

  useEffect(() => {
    if (!branches?.length) {
      setEmployeesByBranch([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      branches.map(branch =>
        api.get(`/users/stores/me/branch/${branch.id}/employees`)
          .then(res => ({
            branch,
            employees: unwrapList(res)
          }))
          .catch(() => ({ branch, employees: [] }))
      )
    ).then(results => {
      setEmployeesByBranch(results);
    }).finally(() => setLoading(false));
  }, [branches]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.email.trim()) {
      setError("Employee email is required");
      return;
    }

    if (!form.branchId) {
      setError("Select a branch for this employee");
      return;
    }

    setInviteLoading(true);
    try {
      const payload = {
        email: form.email.trim(),
        role: form.role,
      };
      const res = await api.post(`/users/stores/me/branch/${form.branchId}/employees`, payload);
      const invited = unwrapItem(res);

      if (invited?.id || invited?.email) {
        setEmployeesByBranch((prev) =>
          prev.map(g => g.branch.id === form.branchId ? { ...g, employees: [invited, ...g.employees] } : g)
        );
      }

      setMessage(`Invitation sent to ${payload.email}`);
      setForm({ email: "", role: "WORKER", branchId: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send invitation. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-surface-variant pb-6">
        <h2 className="display-sm text-primary">Store Personnel</h2>
        <p className="body-lg text-secondary mt-2">Invite managers and staff to help curate your bookstore.</p>
      </div>



      <div className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 overflow-x-auto">
        <div className="px-8 py-6 border-b border-surface-variant">
          <h3 className="headline-md text-primary">Team Members</h3>
        </div>

        {loading ? (
          <div className="p-8 flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-surface border border-outline-variant animate-pulse" />
            ))}
          </div>
        ) : employeesByBranch.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-5xl mb-6 opacity-80 flex justify-center"><FiUsers /></p>
            <p className="headline-md text-primary">No branches yet</p>
            <p className="body-lg text-secondary mt-2">Create a branch first to start adding personnel.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {employeesByBranch.map(({ branch, employees: branchStaff }) => (
              <div key={branch.id} className="border-b border-surface-variant last:border-b-0">
                <div className="bg-surface-variant/30 px-8 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary label-md font-bold">
                    <FiHome />
                  </div>
                  <h4 className="label-md text-primary uppercase tracking-widest">{branch.branchName} Staff</h4>
                  <button
                    onClick={() => {
                      setShowInviteForBranchId(showInviteForBranchId === branch.id ? null : branch.id);
                      setForm({ ...form, branchId: branch.id });
                      setMessage("");
                      setError("");
                    }}
                    className="btn-secondary px-4 py-1.5 label-md ml-6 hover:border-primary hover:text-white transition-colors"
                  >
                    {showInviteForBranchId === branch.id ? "Cancel" : "+ Add Employee"}
                  </button>
                  <span className="label-md text-secondary ml-auto">{branchStaff.length} Member{branchStaff.length !== 1 ? 's' : ''}</span>
                </div>

                {showInviteForBranchId === branch.id && (
                  <div className="px-8 py-8 border-b border-surface-variant bg-surface-container-lowest animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleInvite} className="flex flex-col gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block label-md text-secondary uppercase tracking-wider mb-2">Email Address</label>
                          <input
                            required
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="employee@example.com"
                            className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary body-md text-primary outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block label-md text-secondary uppercase tracking-wider mb-2">Role</label>
                          <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary body-md text-primary outline-none transition-colors"
                          >
                            <option value="WORKER">Worker</option>
                            <option value="MANAGER">Manager</option>
                          </select>
                        </div>
                      </div>

                      {message && <p className="body-md text-primary bg-primary/5 p-3 border border-primary/20">{message}</p>}
                      {error && <p className="body-md text-error bg-error/5 p-3 border border-error/20">{error}</p>}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={inviteLoading}
                          className="btn-primary px-8 py-3 label-md disabled:opacity-60 hover:border-primary hover:border-2 hover:text-primary hover:bg-white"
                        >
                          {inviteLoading ? "Sending..." : "Send Invite to Branch"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                {branchStaff.length === 0 ? (
                  <div className="px-8 py-10 text-center border-t border-surface-variant">
                    <p className="body-md text-secondary italic">No staff members assigned to this branch yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-surface border-b border-surface-variant">
                      <tr>
                        {["Email", "Role", "Status", "Action"].map((h) => (
                          <th key={h} className="px-6 py-4 label-md text-secondary uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant">
                      {branchStaff.map((employee) => (
                        <tr key={employee.id || employee.email} className="hover:bg-surface transition-colors">
                          <td className="px-6 py-4 headline-sm text-primary">{employee.email}</td>
                          <td className="px-6 py-4 body-md text-secondary">{employee.role || "Staff"}</td>
                          <td className="px-6 py-4">
                            <span className="label-md uppercase tracking-wider border border-outline-variant px-3 py-1 text-secondary bg-surface">
                              {employee.status || "Invited"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedEmployee({ ...employee, branchName: branch.branchName })}
                              className="btn-secondary px-4 py-1.5 label-md hover:border-primary hover:text-white transition-colors"
                            >
                              View →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEmployee && (
        <EmployeeDetailDrawer
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}

function OrderDetailDrawer({ orderId, onClose, branches }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [books, setBooks] = useState([]);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true); setErr(""); setOrder(null);
    api.get(`/orders/store/${orderId}`)
      .then((res) => { const d = res.data?.data; setOrder(d && !Array.isArray(d) ? d : null); })
      .catch(() => setErr("Failed to load order details."))
      .finally(() => setLoading(false));
  }, [orderId]);


  useEffect(() => {
    if (!order || !order.items?.length) return;

    // Fetch individual book details for each order item
    setLoading(true);
    Promise.all(
      order.items.map((item) =>
        api.get(`/books/${item.bookId}`)
          .then((r) => {
            const bookData = r.data?.data;
            return {
              ...item, // quantity, price, bookId, id
              title: bookData?.title || "Unknown Title",
              author: bookData?.author || "Unknown Author",
              documents: bookData?.documents || [],
              // Derived image URL for easier rendering
              imageUrl: getBookImageUrl(bookData)
            };
          })
          .catch(() => ({
            ...item,
            title: "Unknown Title",
            author: "Unknown Author",
            documents: []
          }))
      )
    ).then((mergedResults) => {
      setBooks(mergedResults);
    }).finally(() => setLoading(false));
  }, [order]);


  const branchName = (id) => branches.find((b) => b.id === id)?.branchName || "—";
  const fmt = (dt) => dt ? new Date(dt).toLocaleString("en-ET", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const STATUS_COLORS = { PENDING: "bg-surface text-secondary border-outline-variant", CONFIRMED: "bg-primary/5 text-primary border-primary", PAID: "bg-primary/5 text-primary border-primary", SHIPPED: "bg-primary/10 text-primary border-primary", DELIVERED: "bg-primary/10 text-primary border-primary", CANCELLED: "bg-error/5 text-error border-error" };
  const PAYMENT_COLORS = { PENDING: "bg-surface text-secondary border-outline-variant", PAID: "bg-primary/5 text-primary border-primary", COMPLETED: "bg-primary/5 text-primary border-primary", FAILED: "bg-error/5 text-error border-error", REFUNDED: "bg-surface text-secondary border-outline-variant" };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-background border-l border-surface-variant shadow-elevation-1 flex flex-col overflow-hidden">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-variant flex-shrink-0">
          <div>
            <p className="label-md text-secondary uppercase tracking-wider">Order Detail</p>
            <p className="font-mono headline-sm text-primary mt-1">
              #{String(orderId).slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center border border-outline-variant text-secondary hover:text-primary hover:border-primary transition-colors text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-8">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-surface border border-surface-variant animate-pulse" />)}
            </div>
          ) : err ? (
            <p className="body-md text-error">{err}</p>
          ) : !order ? (
            <p className="body-md text-secondary">No data found.</p>
          ) : (
            <>
              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                {[
                  { label: "Branch", value: branchName(order.branchId) },
                  { label: "Placed On", value: fmt(order.createdAt) },
                  { label: "Total", value: `ETB ${Number(order.totalPrice || 0).toLocaleString()}` },
                  { label: "Shipping Address", value: order.shippingAddress || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="border-b border-outline-variant/30 pb-2">
                    <p className="label-md text-secondary uppercase tracking-wider">{label}</p>
                    <p className="body-md text-primary mt-1">{value}</p>
                  </div>
                ))}
                <div className="border-b border-outline-variant/30 pb-2">
                  <p className="label-md text-secondary uppercase tracking-wider">Status</p>
                  <span className={`inline-block mt-1 label-md uppercase tracking-wider px-2 py-0.5 border ${STATUS_COLORS[order.status?.toUpperCase()] || "bg-surface text-secondary border-outline-variant"}`}>
                    {order.status || "—"}
                  </span>
                </div>
                <div className="border-b border-outline-variant/30 pb-2">
                  <p className="label-md text-secondary uppercase tracking-wider">Payment</p>
                  <span className={`inline-block mt-1 label-md uppercase tracking-wider px-2 py-0.5 border ${PAYMENT_COLORS[order.paymentStatus?.toUpperCase()] || "bg-surface text-secondary border-outline-variant"}`}>
                    {order.paymentStatus || "—"}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="headline-sm text-primary mb-4 pb-2 border-b border-surface-variant">Order Items</h3>
                {!books.length ? (
                  <p className="body-md text-secondary">No items found.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {books.map((bookItem, idx) => (
                      <div key={bookItem.id || idx} className="flex items-center gap-4 p-4 bg-surface border border-outline-variant">
                        <div className="w-12 h-16 bg-surface-variant border border-outline-variant flex-shrink-0 overflow-hidden">
                          {bookItem.imageUrl ? (
                            <img src={bookItem.imageUrl} alt={bookItem.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-secondary text-xl"><FiBook /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="label-md text-primary truncate" title={bookItem.title}>{bookItem.title}</p>
                          <p className="body-sm text-secondary truncate">{bookItem.author}</p>
                          <p className="font-mono text-[10px] text-secondary mt-1 uppercase">ID: {String(bookItem.bookId).slice(0, 8)}</p>
                        </div>
                        <div className="flex gap-6 items-center flex-shrink-0">
                          <div className="text-center min-w-[30px]">
                            <p className="label-md text-secondary uppercase tracking-wider text-[10px]">Qty</p>
                            <p className="label-md text-primary">{bookItem.quantity}</p>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="label-md text-secondary uppercase tracking-wider text-[10px]">Unit Price</p>
                            <p className="label-md text-primary">ETB {Number(bookItem.price || 0).toLocaleString()}</p>
                          </div>
                          <div className="text-right min-w-[90px]">
                            <p className="label-md text-secondary uppercase tracking-wider text-[10px]">Subtotal</p>
                            <p className="label-md text-primary font-bold">ETB {(Number(bookItem.price || 0) * bookItem.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function EmployeeDetailDrawer({ employee, onClose }) {
  if (!employee) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-background border-l border-surface-variant shadow-elevation-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-variant flex-shrink-0">
          <div>
            <p className="label-md text-secondary uppercase tracking-wider">Personnel Profile</p>
            <p className="headline-sm text-primary mt-1 truncate max-w-[300px]">
              {employee.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center border border-outline-variant text-secondary hover:text-primary hover:border-primary transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-10">
          {/* Identity Section */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl">
              <FiUser />
            </div>
            <div>
              <p className="display-sm text-primary">{employee.name || "Unregistered User"}</p>
              <p className="body-lg text-secondary mt-1">{employee.role || "Staff"}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { label: "Assigned Branch", value: employee.branchName || "—" },
              { label: "Status", value: employee.status || "Invited", isBadge: true },
              { label: "Phone Number", value: employee.phoneNumber || "—" },
              { label: "Joined On", value: employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : "—" },
              { label: "Email Address", value: employee.email, fullWidth: true },
            ].map((d) => (
              <div key={d.label} className={`${d.fullWidth ? "sm:col-span-2" : ""} border-b border-outline-variant/30 pb-4`}>
                <p className="label-md text-secondary uppercase tracking-wider">{d.label}</p>
                {d.isBadge ? (
                  <span className="inline-block mt-2 label-md uppercase tracking-wider px-3 py-1 border border-outline-variant text-secondary bg-surface">
                    {d.value}
                  </span>
                ) : (
                  <p className="body-lg text-primary mt-1 font-medium">{d.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Actions placeholder */}
          <div className="mt-auto pt-8 border-t border-surface-variant flex flex-col gap-4">
            <button className="w-full btn-secondary py-3 text-error border-error/30 hover:bg-error/5 transition-colors label-md">
              Revoke Access
            </button>
            <button className="w-full btn-secondary py-3 border-outline-variant label-md">
              Change Role
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function OrdersTab({ branches }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPayment, setFilterPayment] = useState("ALL");
  const [drawerOrderId, setDrawerOrderId] = useState(null);

  useEffect(() => {
    api.get("/orders/store")
      .then((res) => setOrders(unwrapList(res)))
      .catch((err) => {
        console.error("Failed to fetch store orders", err);
        setError("Unable to load orders. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Apply filters
  const filtered = orders.filter((o) => {
    const statusOk = filterStatus === "ALL" || o.status?.toUpperCase() === filterStatus;
    const paymentOk = filterPayment === "ALL" || o.paymentStatus?.toUpperCase() === filterPayment;
    return statusOk && paymentOk;
  });

  // Group by branch
  const grouped = branches.reduce((acc, branch) => {
    const branchOrders = filtered.filter((o) => o.branchId === branch.id);
    if (branchOrders.length > 0) acc.push({ branch, orders: branchOrders });
    return acc;
  }, []);
  // Also add ungrouped (branchId not matching any known branch)
  const knownBranchIds = new Set(branches.map((b) => b.id));
  const ungrouped = filtered.filter((o) => !knownBranchIds.has(o.branchId));
  if (ungrouped.length > 0) {
    grouped.push({ branch: { id: "unknown", branchName: "Other" }, orders: ungrouped });
  }

  const STATUS_COLORS = {
    PENDING: "bg-surface text-secondary border-outline-variant",
    CONFIRMED: "bg-primary/5 text-primary border-primary",
    SHIPPED: "bg-primary/10 text-primary border-primary",
    DELIVERED: "bg-primary/10 text-primary border-primary",
    CANCELLED: "bg-error/5 text-error border-error",
  };
  const PAYMENT_COLORS = {
    PENDING: "bg-surface text-secondary border-outline-variant",
    PAID: "bg-primary/5 text-primary border-primary",
    FAILED: "bg-error/5 text-error border-error",
    REFUNDED: "bg-surface text-secondary border-outline-variant",
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleString("en-ET", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

  return (
    <div className="flex flex-col gap-8">
      {/* Header + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-variant pb-6 gap-4">
        <div>
          <h2 className="display-sm text-primary">Orders</h2>
          <p className="body-md text-secondary mt-1">
            {loading ? "Loading..." : `${orders.length} total · ${filtered.length} shown`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-auto px-4 py-2 bg-surface border border-outline-variant text-primary label-md outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="appearance-auto px-4 py-2 bg-surface border border-outline-variant text-primary label-md outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="ALL">All Payments</option>
            <option value="PENDING">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/5 border border-error text-error body-md px-6 py-4">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-container-lowest border border-surface-variant animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-variant p-16 text-center shadow-elevation-1">
          <p className="text-5xl mb-6 opacity-80 flex justify-center"><FiBox /></p>
          <p className="headline-md text-primary">No orders yet</p>
          <p className="body-lg text-secondary mt-2">Orders placed for your store will appear here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-variant p-12 text-center shadow-elevation-1">
          <p className="headline-md text-primary">No orders match the selected filters</p>
          <button
            onClick={() => { setFilterStatus("ALL"); setFilterPayment("ALL"); }}
            className="btn-secondary mt-4 px-6 py-2 label-md"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {grouped.map(({ branch, orders: branchOrders }) => (
            <div key={branch.id}>
              {/* Branch header */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-primary/20">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary label-md font-bold flex-shrink-0">
                  <FiHome />
                </div>
                <div>
                  <h3 className="headline-md text-primary">{branch.branchName}</h3>
                  <p className="body-md text-secondary">{branchOrders.length} order{branchOrders.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {/* Orders table */}
              <div className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 overflow-x-auto">
                <table className="w-full text-left min-w-[640px]">
                  <thead className="bg-surface border-b border-surface-variant">
                    <tr>
                      {["Order ID", "Date", "Total", "Status", "Payment", ""].map((h) => (
                        <th key={h} className="px-6 py-4 label-md text-secondary uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant">
                    {branchOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-surface transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono label-md text-primary">
                            #{String(order.id).slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 body-md text-secondary whitespace-nowrap">
                          {fmt(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 headline-sm text-primary whitespace-nowrap">
                          ETB {Number(order.totalPrice || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`label-md uppercase tracking-wider px-2 py-0.5 border ${STATUS_COLORS[order.status?.toUpperCase()] || "bg-surface text-secondary border-outline-variant"
                            }`}>
                            {order.status || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`label-md uppercase tracking-wider px-2 py-0.5 border ${PAYMENT_COLORS[order.paymentStatus?.toUpperCase()] || "bg-surface text-secondary border-outline-variant"
                            }`}>
                            {order.paymentStatus || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setDrawerOrderId(order.id)}
                            className="btn-secondary px-4 py-1.5 label-md hover:border-primary hover:text-white transition-colors whitespace-nowrap"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {drawerOrderId && (
        <OrderDetailDrawer
          orderId={drawerOrderId}
          branches={branches}
          onClose={() => setDrawerOrderId(null)}
        />
      )}
    </div>
  );
}

// ── Premium Subscription Modal ─────────────────────────────────────────────
function SubscriptionPaymentForm({ onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setPaymentError("");
    try {
      // Confirm the SetupIntent to get the payment method
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: `${window.location.origin}/store/dashboard` },
        redirect: "if_required",
      });
      if (error) {
        setPaymentError(error.message || "Payment setup failed.");
        onError && onError(error.message);
      } else if (setupIntent?.payment_method) {
        onSuccess(setupIntent.payment_method);
      } else {
        setPaymentError("Could not retrieve payment method. Please try again.");
      }
    } catch (err) {
      setPaymentError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement />
      {paymentError && (
        <div className="flex items-center gap-3 bg-error/10 border border-error/20 p-4 text-error body-md">
          <FiAlertTriangle /> {paymentError}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full btn-primary py-4 label-md disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
        ) : (
          <><FiCreditCard /> Subscribe — $29/month</>
        )}
      </button>
    </form>
  );
}

function PremiumSubscriptionModal({ onClose, onSubscribed }) {
  const [phase, setPhase] = useState("idle"); // idle | loading | ready | confirming | success | error
  const [setupSecret, setSetupSecret] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setPhase("loading");
    api.post("/payments/subscription/setup")
      .then((res) => {
        const data = res.data?.data;
        setSetupSecret(data?.setupIntentClientSecret);
        setPhase("ready");
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || "Failed to set up subscription.");
        setPhase("error");
      });
  }, []);

  const handlePaymentSuccess = async (paymentMethodId) => {
    setPhase("confirming");
    try {
      await api.post("/payments/subscription/confirm", { paymentMethodId });
      setPhase("success");
      onSubscribed && onSubscribed();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to activate subscription.");
      setPhase("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-background border border-surface-variant shadow-elevation-3 p-8 w-full max-w-lg rounded-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-variant">
          <div>
            <h2 className="display-sm text-primary flex items-center gap-3">
              <FiZap className="text-primary" /> Upgrade to Premium
            </h2>
            <p className="body-md text-secondary mt-1">Unlock lower commissions and priority support.</p>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors"><FiX size={22} /></button>
        </div>

        {/* Plan comparison strip */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: "Commission", free: "5%", premium: "2%" },
            { label: "Monthly Fee", free: "Free", premium: "$29" },
            { label: "Analytics", free: "Basic", premium: "Advanced" },
            { label: "Support", free: "Standard", premium: "Priority" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between p-3 border border-surface-variant bg-surface">
              <span className="label-md text-secondary">{row.label}</span>
              <span className="label-md text-primary font-bold">{row.premium}</span>
            </div>
          ))}
        </div>

        {/* Content by phase */}
        {phase === "success" ? (
          <div className="text-center py-8 flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl">
              <FiCheckCircle />
            </div>
            <div>
              <p className="headline-md text-primary">Welcome to Premium!</p>
              <p className="body-md text-secondary mt-2">Your plan will be updated shortly. Enjoy lower commissions and priority support.</p>
            </div>
            <button onClick={onClose} className="btn-primary px-8 py-3 label-md">Done</button>
          </div>
        ) : phase === "loading" ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-secondary">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="body-md">Setting up secure payment...</p>
          </div>
        ) : phase === "error" ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex items-center gap-3 bg-error/10 border border-error/20 p-4 text-error body-md w-full">
              <FiAlertTriangle /> {errorMsg}
            </div>
            <button onClick={onClose} className="btn-secondary px-8 py-3 label-md">Close</button>
          </div>
        ) : phase === "confirming" ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-secondary">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="body-md">Activating your subscription...</p>
          </div>
        ) : setupSecret ? (
          <>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: setupSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: "#E63946", borderRadius: "4px", fontFamily: "DM Sans, sans-serif" },
                },
              }}
            >
              <SubscriptionPaymentForm
                onSuccess={handlePaymentSuccess}
                onError={(msg) => { setErrorMsg(msg); setPhase("error"); }}
              />
            </Elements>
            <div className="mt-6 flex items-center gap-2 text-xs text-secondary border-t border-surface-variant pt-4">
              <FiLock /><span>Secured by Stripe. Cancel anytime from Settings.</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function StoreDashboard() {
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // Fetch subscription status
  useEffect(() => {
    api.get("/payments/subscription/status")
      .then((res) => setSubscription(res.data?.data))
      .catch(() => setSubscription(null));
  }, []);

  const handleSubscribed = () => {
    // Refresh store and subscription after upgrade
    api.get("/stores/me").then((res) => setStore(unwrapItem(res))).catch(() => {});
    api.get("/payments/subscription/status").then((res) => setSubscription(res.data?.data)).catch(() => {});
    setShowSubscriptionModal(false);
  };

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);
    try {
      const res = await api.delete("/payments/subscription/cancel");
      setSubscription(res.data?.data);
    } catch (err) {
      console.error("Failed to cancel subscription", err);
    } finally {
      setCancellingSubscription(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    // Fetch store info using keycloak_id
    api.get("/stores/me")
      .then((res) => {
        const s = unwrapItem(res);
        setStore(s);
        return s;
      })
      .then((s) => {
        if (!s?.id) {
          setLoading(false);
          return;
        }

        // Fetch branches, all store orders, and backend revenue in parallel
        return Promise.all([
          api.get(`/stores/me/branch`),
          api.get(`/orders/store`),
          api.get(`/orders/store/${s.id}/revenue`).catch(() => ({ data: { data: 0 } }))
        ])
          .then(async ([branchRes, ordersRes]) => {
            const branchList = unwrapList(branchRes);
            const orderList = unwrapList(ordersRes);

            // 1. Determine commission rate based on store plan (PREMIUM = 2% fee -> 98% kept, FREE = 5% fee -> 95% kept)
            const commissionMultiplier = s?.plan === "PREMIUM" ? 0.98 : 0.95;

            // 2. Calculate active orders count (status: PENDING, PAID, SHIPPED)
            const activeOrders = orderList.filter(
              (o) => o.status === "PENDING" || o.status === "PAID" || o.status === "SHIPPED"
            ).length;

            // 3. Calculate total revenue locally using correct commission rate
            const calculatedTotalRevenue = orderList
              .filter((o) => o.status === "DELIVERED")
              .reduce((sum, o) => sum + (o.totalPrice || 0), 0) * commissionMultiplier;

            // 4. Process branches
            let totalBooks = 0;
            const updatedBranches = await Promise.all(
              branchList.map(async (branch) => {
                let bookCount = 0;
                try {
                  const bcRes = await api.get(`/books/store/branch/${branch.id}/count`);
                  bookCount = typeof bcRes.data?.data === "number" ? bcRes.data.data : 0;
                } catch (e) {
                  console.error("Error fetching book count for branch", branch.id, e);
                }
                totalBooks += bookCount;

                // Branch revenue: only when orders are DELIVERED, multiplied by commissionMultiplier
                const branchDeliveredOrders = orderList.filter(
                  (o) => o.branchId === branch.id && o.status === "DELIVERED"
                );
                const branchRawRevenue = branchDeliveredOrders.reduce(
                  (sum, o) => sum + (o.totalPrice || 0),
                  0
                );
                const branchRevenue = branchRawRevenue * commissionMultiplier;

                // Total order count for this branch
                const branchOrderCount = orderList.filter((o) => o.branchId === branch.id).length;

                return {
                  ...branch,
                  bookCount,
                  orderCount: branchOrderCount,
                  revenue: branchRevenue
                };
              })
            );

            setBranches(updatedBranches);
            setOrders(orderList);
            setStats({
              revenue: calculatedTotalRevenue,
              totalOrders: activeOrders,
              totalBooks: totalBooks
            });
          });
      })
      .catch((err) => {
        console.error("Error initializing dashboard data:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-primary">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="headline-md">Loading your library...</p>
        </div>
      </div>
    );
  }

  const TABS = {
    overview: <OverviewTab store={store} branches={branches} stats={stats} onUpgrade={() => setShowSubscriptionModal(true)} subscription={subscription} />,
    branches: <BranchesTab branches={branches} setBranches={setBranches} />,
    books: <BooksTab branches={branches} />,
    earnings: <EarningsTab store={store} orders={orders} branches={branches} />,
    orders: <OrdersTab branches={branches} />,
    employees: <EmployeesTab storeId={store?.id} branches={branches} />,
    settings: (
      <div className="flex flex-col gap-8">
        {/* Store Metadata */}
        <div className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-8">
          <h2 className="display-sm text-primary mb-8 border-b border-surface-variant pb-4">Store Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            {[
              { label: "Store Name", value: store?.storeName },
              { label: "Email", value: store?.email },
              { label: "Phone", value: store?.phone },
              { label: "Region", value: store?.region },
              { label: "City", value: store?.city },
              { label: "Plan", value: store?.plan },
              { label: "TIN", value: store?.tin },
              { label: "Reg. Number", value: store?.businessRegNumber },
              { label: "Bank", value: store?.bankName },
              { label: "Verification", value: store?.verificationStatus },
            ].map((item) => (
              <div key={item.label} className="border-b border-outline-variant/30 pb-2">
                <p className="label-md text-secondary uppercase tracking-wider">{item.label}</p>
                <p className="headline-sm text-primary mt-2">{item.value || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Management Section */}
        <div className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-8">
          <h2 className="display-sm text-primary mb-6 border-b border-surface-variant pb-4 flex items-center gap-3">
            <FiZap className="text-primary" /> Subscription
          </h2>

          {store?.plan === "PREMIUM" ? (
            <div className="flex flex-col gap-6">
              {/* Active Premium banner */}
              <div className="flex items-start gap-6 p-6 bg-primary/5 border border-primary">
                <span className="text-3xl text-primary"><FiStar /></span>
                <div className="flex-1">
                  <p className="headline-md text-primary">Premium Plan Active</p>
                  <p className="body-md text-secondary mt-1">2% commission · Priority support · Advanced analytics</p>
                  {subscription?.currentPeriodEnd && (
                    <p className="body-md text-secondary mt-2 flex items-center gap-2">
                      <FiCalendar />
                      {subscription.cancelAtPeriodEnd
                        ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                        : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Cancel option */}
              {!subscription?.cancelAtPeriodEnd && (
                <div className="flex items-center justify-between p-4 border border-outline-variant bg-surface">
                  <div>
                    <p className="label-md text-secondary uppercase tracking-wider">Cancel subscription</p>
                    <p className="body-md text-secondary mt-1">Your plan stays active until the end of the billing period.</p>
                  </div>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancellingSubscription}
                    className="px-6 py-3 label-md border border-error text-error hover:bg-error hover:text-white transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {cancellingSubscription ? (
                      <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Cancelling...</>
                    ) : "Cancel Plan"}
                  </button>
                </div>
              )}
              {subscription?.cancelAtPeriodEnd && (
                <div className="flex items-center gap-3 p-4 border border-amber-300 bg-amber-50">
                  <FiAlertTriangle className="text-amber-600 flex-shrink-0" />
                  <p className="body-md text-amber-800">
                    Your Premium plan is set to cancel at the end of the billing period.
                    After that your store will be downgraded to the Free plan.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Free Plan + Upgrade CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { name: "Free Plan", commission: "5% commission", fee: "No monthly fee", analytics: "Basic analytics", support: "Standard support", color: "border-outline-variant", current: true },
                  { name: "Premium Plan", commission: "2% commission", fee: "$29 / month", analytics: "Advanced analytics", support: "Priority support", color: "border-primary bg-primary/5", highlight: true },
                ].map((plan) => (
                  <div key={plan.name} className={`border p-6 shadow-elevation-1 ${plan.color}`}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="headline-sm text-primary">{plan.name}</p>
                      {plan.current && <span className="label-sm px-2 py-0.5 bg-surface-variant text-secondary border border-outline-variant">Current</span>}
                    </div>
                    {[plan.commission, plan.fee, plan.analytics, plan.support].map((f) => (
                      <p key={f} className="body-md text-secondary flex items-center gap-2 mb-2">
                        <FiCheck className={plan.highlight ? "text-primary" : "text-secondary"} /> {f}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="btn-primary px-8 py-4 label-md self-start flex items-center gap-2"
              >
                <FiZap /> Upgrade to Premium
              </button>
            </div>
          )}
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased pt-24 pb-16">
      <Navbar mode="dashboard" badgeText="Store" />

      <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col lg:flex-row gap-12 w-full">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <StoreSidebar
            store={store}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            navigate={navigate}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {TABS[activeTab]}
        </main>
      </div>

      {/* Premium Subscription Modal */}
      {showSubscriptionModal && (
        <PremiumSubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          onSubscribed={handleSubscribed}
        />
      )}
    </div>
  );
}
