import { useCallback, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosInstance";
import { unwrapItem, unwrapList } from "../../utils/apiHelpers";
import { getBookDocumentUrl, getBookImageUrl } from "../../utils/book";
import { FiPieChart, FiBook, FiBox, FiHome, FiClock, FiX, FiCheck } from "react-icons/fi";

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
            className={`flex-1 py-3 label-md border transition-colors ${
              isDanger 
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

function EmployeeSidebar({ branch, activeTab, setActiveTab }) {
  const NAV = [
    { id: "overview", icon: <FiPieChart />, label: "Dashboard" },
    { id: "inventory", icon: <FiBook />, label: "Inventory" },
    { id: "orders", icon: <FiBox />, label: "Orders" },
  ];

  return (
    <aside className="w-full lg:w-64 bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-6 flex flex-col gap-2 relative lg:sticky lg:top-28 self-start">
      <div className="pb-6 mb-4 border-b border-surface-variant">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-outline-variant bg-surface flex items-center justify-center text-xl">
            <FiHome />
          </div>
          <div className="min-w-0">
            <p className="display-sm text-primary truncate">
              {branch?.branchName || "My Branch"}
            </p>
            <span className="label-md px-2 py-0.5 mt-1 inline-block border bg-surface-variant text-secondary border-outline-variant">
              Employee Portal
            </span>
          </div>
        </div>
      </div>

      {NAV.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex items-center gap-4 px-4 py-3 text-left transition-colors border-l-2 ${activeTab === item.id
            ? "border-primary bg-primary text-on-primary font-bold label-md"
            : "border-transparent text-secondary hover:bg-surface-variant hover:text-primary label-md"
            }`}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </aside>
  );
}

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get employee's branch info
    api.get("/stores/me/branch/my-branch")
      .then(res => {
        setBranch(unwrapItem(res) || null);
      })
      .catch(err => console.error("Failed to fetch branch", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased pt-24 pb-16">
      <Navbar mode="dashboard" badgeText="Employee" />

      <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col lg:flex-row gap-12 w-full">
        {/* Sidebar with fix for overlapping on smaller screens */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <EmployeeSidebar
            branch={branch}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        <main className="flex-1 min-w-0">
          {activeTab === "overview" && <OverviewTab branch={branch} />}
          {activeTab === "inventory" && <InventoryTab branch={branch} />}
          {activeTab === "orders" && <OrdersTab branch={branch} />}
        </main>
      </div>
    </div>
  );
}
function OverviewTab({ branch }) {
  const [stats, setStats] = useState({ totalBooks: 0, pendingOrders: 0 });

  useEffect(() => {
    if (!branch) {
      return;
    }
    // Fetch stats
    Promise.all([
      api.get(`/books/store/branch/${branch.id}/count`),
      api.get(`/orders/branch/${branch.id}/count`)
    ]).then(([countRes, ordersRes]) => {
      const rawCount = countRes?.data?.data ?? countRes?.data ?? 0;
      const rawOrderCount = ordersRes?.data?.data ?? ordersRes?.data ?? 0;
      setStats({
        totalBooks: Number(rawCount),
        pendingOrders: Number(rawOrderCount)
      });
    });
  }, [branch]);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="label-md text-secondary uppercase tracking-wider mb-2">Welcome Back</p>
        <h1 className="display-md text-primary">{branch?.branchName} Overview</h1>
        <p className="body-lg text-secondary mt-2 max-w-2xl">
          Manage your branch inventory and process incoming orders efficiently.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard icon={<FiBook />} label="Total Titles" value={stats.totalBooks} sub="Available in stock" />
        <StatCard icon={<FiClock />} label="Pending Orders" value={stats.pendingOrders} sub="Awaiting processing" />
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant p-8">
        <h3 className="headline-md text-primary mb-6">Branch Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            { label: "City", value: branch?.city },
            { label: "Region", value: branch?.region },
            { label: "Phone", value: branch?.phoneNumber },
            { label: "Email", value: branch?.email },
          ].map(d => (
            <div key={d.label} className="border-b border-outline-variant/30 pb-4">
              <p className="label-md text-secondary uppercase tracking-wider">{d.label}</p>
              <p className="body-lg text-primary mt-1 font-medium">{d.value || "—"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InventoryTab({ branch }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", category: "", price: "", condition: "NEW", description: "" });
  const [files, setFiles] = useState({ imageFile: null });
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

  const CATEGORIES = ["Fiction", "Non-Fiction", "Academic", "Children", "Biography", "History", "Science", "Self-Help"];

  const fetchBooks = useCallback(async () => {
    if (!branch) return;
    setLoading(true);
    try {
      const res = await api.get(`/books/store/branch/${branch.id}`);
      setBooks(unwrapList(res));
    } catch (err) {
      console.error("Failed to fetch books", err);
    } finally { setLoading(false); }
  }, [branch]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const formData = new FormData();
      const bookData = { ...form, price: parseFloat(form.price) };
      formData.append("data", new Blob([JSON.stringify(bookData)], { type: "application/json" }));
      if (files.imageFile) formData.append("image", files.imageFile);

      // Post to branch-specific endpoint as requested
      const res = await api.post(`/books/store/branch/${branch.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const newBook = unwrapItem(res);
      if (newBook) {
        setBooks([newBook, ...books]);
      }
      setShowAdd(false);
      setForm({ title: "", author: "", category: "", price: "", condition: "NEW", description: "" });
      setFiles({ imageFile: null });
    } catch (err) {
      console.error("Failed to add book", err);
    } finally { setAddLoading(false); }
  };

  const handleDelete = (bookId) => {
    showConfirm({
      title: "Delete Book Title",
      message: "Are you sure you want to permanently delete this book title? This action cannot be undone.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/books/store/${bookId}`);
          setBooks(books.filter(b => b.id !== bookId));
        } catch (err) {
          console.error("Failed to delete book", err);
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-surface-variant pb-6">
        <h2 className="display-sm text-primary">Inventory</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="btn-primary px-6 py-3 label-md hover:bg-white hover:text-primary hover:border-2 border-primary transition-colors"
        >
          {showAdd ? "Cancel" : "+ Add Title"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="headline-md text-primary">New Book Entry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { key: "title", label: "Title", placeholder: "Book title" },
              { key: "author", label: "Author", placeholder: "Author name" },
              { key: "price", label: "Price (ETB)", placeholder: "e.g. 350", type: "number" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block label-md text-secondary uppercase tracking-wider mb-2">{f.label}</label>
                <input
                  required
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary body-md text-primary outline-none transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block label-md text-secondary uppercase tracking-wider mb-2">Category</label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary body-md text-primary outline-none transition-colors"
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block label-md text-secondary uppercase tracking-wider mb-2">Condition</label>
              <select
                required
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary body-md text-primary outline-none transition-colors"
              >
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block label-md text-secondary uppercase tracking-wider mb-2">Cover Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFiles({ imageFile: e.target.files[0] })}
              className="w-full body-md text-secondary file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
          <button
            type="submit"
            disabled={addLoading}
            className="btn-primary w-full py-4 headline-sm disabled:opacity-50"
          >
            {addLoading ? "Saving..." : "Add to Branch Inventory"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-surface-variant animate-pulse"></div>)}
        </div>
      ) : books.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-outline-variant">
          <p className="headline-md text-secondary">No books found</p>
          <p className="body-md text-secondary mt-2">Start adding titles to your branch</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {books.map((book) => (
            <div key={book.id} className="bg-surface-container-lowest border border-surface-variant p-6 shadow-elevation-1 flex flex-col gap-4 group hover:border-primary transition-colors">
              <div className="flex gap-4">
                {getBookImageUrl(book) ? (
                  <img src={getBookImageUrl(book)} alt={book.title} className="w-20 h-28 object-cover border border-outline-variant flex-shrink-0" />
                ) : (
                  <div className="w-20 h-28 bg-surface-variant border border-outline-variant flex items-center justify-center text-secondary flex-shrink-0">
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

              <div className="mt-auto pt-4 border-t border-surface-variant">
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

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryPin, setDeliveryPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/orders/branch");
      setOrders(unwrapList(res));
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (deliveryPin.length !== 6) {
      setPinError("PIN must be 6 digits.");
      return;
    }
    setPinLoading(true);
    setPinError("");
    try {
      await api.post("/orders/branch/confirm-delivery", {
        pin: deliveryPin
      });
      // Success! Refresh list and close
      fetchOrders();
      setSelectedOrder(null);
      setDeliveryPin("");
    } catch (err) {
      setPinError(err.response?.data?.message || "Invalid PIN. Please try again.");
    } finally { setPinLoading(false); }
  };

  const STATUS_COLORS = {
    PENDING: "bg-surface text-secondary border-outline-variant",
    CONFIRMED: "bg-primary/5 text-primary border-primary",
    PAID: "bg-primary/5 text-primary border-primary",
    SHIPPED: "bg-primary/10 text-primary border-primary",
    DELIVERED: "bg-primary/10 text-primary border-primary",
    CANCELLED: "bg-error/5 text-error border-error"
  };

  return (
    <div className="flex flex-col gap-8">
      <h2 className="display-sm text-primary border-b border-surface-variant pb-6">Orders</h2>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-surface-variant animate-pulse"></div>)}
        </div>
      ) : orders.length === 0 ? (
        <p className="body-lg text-secondary text-center py-20">No orders found for this branch.</p>
      ) : (
        <div className="bg-surface-container-lowest border border-surface-variant overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-variant">
                <th className="px-6 py-4 label-md text-secondary uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 label-md text-secondary uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 label-md text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 label-md text-secondary uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-surface-variant hover:bg-surface-variant/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-primary uppercase">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 body-md text-secondary">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`label-md px-2 py-0.5 border ${STATUS_COLORS[order.status?.toUpperCase()] || ""}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn-secondary px-4 py-2 label-md hover:text-primary hover:border-primary transition-colors"
                    >
                      Process →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delivery Confirmation Drawer */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <aside className="fixed top-0 right-0 h-full w-full max-w-md z-50 bg-background border-l border-surface-variant shadow-elevation-1 flex flex-col p-8 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-10">
              <h3 className="headline-md text-primary">Process Delivery</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-2xl"><FiX /></button>
            </div>

            <div className="mb-10">
              <p className="label-md text-secondary uppercase tracking-wider mb-2">Order Summary</p>
              <div className="p-4 bg-surface-variant border border-outline-variant">
                <p className="headline-sm text-primary">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                <p className="body-md text-secondary mt-1">Status: {selectedOrder.status}</p>
                <p className="body-md text-primary font-bold mt-2">Total: ETB {selectedOrder.totalPrice}</p>
              </div>
            </div>

            {selectedOrder.status === "DELIVERED" ? (
              <div className="text-center py-10 bg-primary/5 border border-primary p-6">
                <p className="headline-sm text-primary flex items-center justify-center gap-2"><FiCheck /> Delivery Confirmed</p>
                <p className="body-md text-secondary mt-2">This order has already been marked as delivered.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmDelivery} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="label-md text-secondary uppercase tracking-wider">Enter Delivery PIN</label>
                  <p className="body-sm text-secondary mb-2 italic">Ask the customer for their 6-digit confirmation PIN.</p>
                  <input
                    required
                    type="text"
                    maxLength="6"
                    value={deliveryPin}
                    onChange={(e) => setDeliveryPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full text-center tracking-[1em] text-2xl py-4 bg-surface border border-outline-variant focus:border-primary outline-none transition-colors"
                  />
                  {pinError && <p className="text-error label-md mt-1">{pinError}</p>}
                </div>
                <button
                  type="submit"
                  disabled={pinLoading || deliveryPin.length !== 6}
                  className="btn-primary py-4 headline-sm disabled:opacity-50"
                >
                  {pinLoading ? "Confirming..." : "Confirm & Complete"}
                </button>
              </form>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
