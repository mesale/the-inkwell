import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axiosInstance";
import { unwrapList, unwrapItem } from "../../utils/apiHelpers";
import { getBookImageUrl } from "../../utils/book";
import { FiBox, FiCheck, FiBook, FiPhone, FiMail, FiCheckCircle, FiTruck, FiDollarSign, FiAlertTriangle, FiInbox, FiHome, FiLock, FiCreditCard, FiX, FiRefreshCw } from "react-icons/fi";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const STATUS_COLORS = {
  PENDING: { bg: "bg-surface-variant", text: "text-on-surface-variant" },
  PAID: { bg: "bg-blue-100", text: "text-blue-700" },
  SHIPPED: { bg: "bg-purple-100", text: "text-purple-700" },
  DELIVERED: { bg: "bg-primary", text: "text-on-primary" },
  CANCELLED: { bg: "bg-surface", text: "text-on-surface" },
};

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-surface-container-lowest border border-surface-variant p-6 shadow-elevation-1 rounded-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-secondary label-md uppercase tracking-wider">{label}</p>
        <p className="text-primary font-bold headline-sm mt-1">{value}</p>
      </div>
    </div>
  );
}

// ─── Stripe Payment Form (inside modal) ──────────────────────────────────────
function StripePaymentForm({ amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setPaymentError("");
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/dashboard` },
      redirect: "if_required",
    });
    if (error) {
      setPaymentError(error.message || "Payment failed. Please try again.");
    } else {
      onSuccess();
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {amount && (
        <div className="flex items-center justify-between bg-surface-container-lowest border border-surface-variant p-4">
          <p className="label-md text-secondary uppercase tracking-wider">Amount Due</p>
          <p className="headline-sm text-primary font-bold">ETB {amount}</p>
        </div>
      )}
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
          <><FiCreditCard /> Pay Now</>
        )}
      </button>
    </form>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ order, onClose, onPaid }) {
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    api.post(`/payments/checkout/${order.id}`)
      .then((res) => {
        const data = res.data?.data;
        setClientSecret(data.stripeClientSecret);
        setAmount(data.amount);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to set up payment."))
      .finally(() => setLoading(false));
  }, [order.id]);

  const handleSuccess = () => {
    setPaid(true);
    onPaid(order.id);
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
            <h2 className="display-sm text-primary">Complete Payment</h2>
            <p className="body-md text-secondary mt-1">Order #{order.id?.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors"><FiX size={22} /></button>
        </div>

        {paid ? (
          <div className="text-center py-8 flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl">
              <FiCheckCircle />
            </div>
            <div>
              <p className="headline-md text-primary">Payment Complete</p>
              <p className="body-md text-secondary mt-2">Your order has been confirmed and is being processed.</p>
            </div>
            <button onClick={onClose} className="btn-primary px-8 py-3 label-md">Done</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-secondary">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="body-md">Setting up secure payment...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex items-center gap-3 bg-error/10 border border-error/20 p-4 text-error body-md w-full">
              <FiAlertTriangle /> {error}
            </div>
            <button onClick={onClose} className="btn-secondary px-8 py-3 label-md">Close</button>
          </div>
        ) : clientSecret ? (
          <>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: "#E63946", borderRadius: "4px", fontFamily: "DM Sans, sans-serif" },
                },
              }}
            >
              <StripePaymentForm amount={amount} onSuccess={handleSuccess} />
            </Elements>
            <div className="mt-6 flex items-center gap-2 text-xs text-secondary border-t border-surface-variant pt-4">
              <FiLock /><span>Secured by Stripe. Funds held in escrow until delivery.</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Refund Modal ─────────────────────────────────────────────────────────────
function RefundModal({ order, onClose, onRefunded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRefund = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post(`/payments/refund/${order.id}`);
      setSuccess(true);
      onRefunded(order.id);
    } catch (err) {
      setError(err.response?.data?.message || "Refund request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-surface-variant shadow-elevation-3 p-8 w-full max-w-md rounded-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-variant">
          <div>
            <h2 className="font-display font-bold text-xl text-primary">Request Refund</h2>
            <p className="body-md text-secondary mt-1">Order #{order.id?.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <FiX size={22} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-600 text-3xl">
              <FiCheckCircle />
            </div>
            <div>
              <p className="font-display font-bold text-lg text-primary">Refund Initiated</p>
              <p className="body-md text-secondary mt-2 leading-relaxed">
                Your refund has been submitted to Stripe. The amount will be returned to your original payment method within 5–10 business days.
              </p>
            </div>
            <button onClick={onClose} className="btn-primary px-8 py-3 label-md">Done</button>
          </div>
        ) : (
          <>
            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 p-4 mb-6 flex gap-3">
              <FiAlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="label-md text-amber-800">Are you sure?</p>
                <p className="body-md text-amber-700 mt-1 leading-relaxed">
                  This will cancel your order and issue a full refund of <strong>ETB {order.totalPrice}</strong> to your original payment method.
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Refund details */}
            <div className="bg-surface-container-lowest border border-surface-variant p-4 mb-6 flex justify-between items-center">
              <span className="label-md text-secondary uppercase tracking-wider">Refund Amount</span>
              <span className="font-display font-bold text-xl text-primary">ETB {order.totalPrice}</span>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-error/10 border border-error/20 p-4 text-error body-md mb-4">
                <FiAlertTriangle /> {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 btn-secondary py-3 label-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={loading}
                className="flex-1 py-3 label-md font-semibold bg-error text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 rounded-lg"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                ) : (
                  <><FiRefreshCw /> Confirm Refund</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onTrack, onDetails, onPay, onRefund, isLoading }) {
  const status = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
  const isPending = order.status === "PENDING";
  const isPaid = order.status === "PAID";
  return (
    <div className="bg-surface-container-lowest border border-surface-variant p-6 shadow-elevation-1 rounded-sm flex flex-col sm:flex-row sm:items-center gap-6">
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-2xl flex-shrink-0 border border-outline-variant">
        <FiBox />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="headline-sm text-primary">Order #{order.id?.slice(0, 8)}</p>
          <span className={`label-sm px-3 py-1 border ${status.bg === "bg-primary" ? "bg-primary text-on-primary border-primary" : "bg-surface text-secondary border-outline-variant"}`}>
            {order.status}
          </span>
          {isPending && (
            <span className="label-sm px-3 py-1 border border-amber-400 bg-amber-50 text-amber-700">Awaiting Payment</span>
          )}
          {isPaid && (
            <span className="label-sm px-3 py-1 border border-blue-300 bg-blue-50 text-blue-700">Not Yet Delivered</span>
          )}
        </div>
        <p className="body-md text-secondary mt-1">
          Branch #{order.branchId?.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Price + Actions */}
      <div className="flex flex-col items-end gap-3 flex-shrink-0">
        <p className="text-primary headline-sm">ETB {order.totalPrice}</p>
        <div className="flex flex-wrap gap-3">
          {isPending && (
            <button
              onClick={() => onPay(order)}
              disabled={isLoading}
              className="btn-primary px-6 py-2 label-md disabled:opacity-60 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 border-amber-600"
            >
              <FiCreditCard /> {isLoading ? "Loading..." : "Pay Now"}
            </button>
          )}
          {isPaid && (
            <button
              onClick={() => onRefund(order)}
              disabled={isLoading}
              className="px-6 py-2 label-md disabled:opacity-60 flex items-center gap-2 border border-error text-error hover:bg-error hover:text-white transition-colors rounded-lg"
            >
              <FiRefreshCw size={14} /> Request Refund
            </button>
          )}
          <button
            onClick={() => onTrack(order.id)}
            disabled={isLoading}
            className="btn-primary px-6 py-2 label-md disabled:opacity-60"
          >
            {isLoading ? "Loading..." : "Track"}
          </button>
          <button
            onClick={() => onDetails(order.id)}
            disabled={isLoading}
            className="btn-secondary px-6 py-2 label-md disabled:opacity-60"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderTrackingModal({ order, onClose }) {
  const steps = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];
  const currentStep = steps.indexOf(order.status);
  return (
    <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-background border border-surface-variant shadow-elevation-3 p-8 w-full max-w-2xl max-h-[93vh] overflow-y-auto rounded-sm">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-variant">
          <div>
            <h2 className="display-sm text-primary">Order Progress</h2>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="bg-surface-container-lowest border border-surface-variant p-6">
            <p className="label-md text-secondary uppercase tracking-wider">Total Price</p>
            <p className="headline-sm text-primary mt-2">ETB {order.totalPrice}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {steps.map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={step} className="flex items-start gap-6">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 label-md border ${isCompleted ? "bg-primary text-on-primary border-primary"
                      : isActive ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-variant text-secondary border-outline-variant"
                    }`}>
                    {isCompleted ? <FiCheck /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-px h-12 mt-2 ${isCompleted ? "bg-primary" : "bg-outline-variant"}`} />
                  )}
                </div>
                <div className="pt-2 pb-8">
                  <p className={`headline-sm ${isActive ? "text-primary"
                      : isCompleted ? "text-primary"
                        : "text-secondary"
                    }`}>
                    {step.charAt(0) + step.slice(1).toLowerCase()}
                  </p>
                  {isActive && (
                    <p className="body-md text-secondary mt-1">Current status</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full btn-primary py-4 label-md"
        >
          Close
        </button>

      </div>
    </div>);
}

function OrderItemRow({ item, index }) {
  const [book, setBook] = useState(null);

  useEffect(() => {
    const bookId = item.bookId || item.book_id;
    if (!bookId) {
      return;
    }
    api.get(`/books/${bookId}`)
      .then(res => setBook(unwrapItem(res)))
      .catch(() => { });
  }, [item]);

  const title = book?.title || item.title || item.bookTitle || item.name || `Item ${index + 1}`;
  const author = book?.author || "Unknown Author";
  const imageUrl = book ? getBookImageUrl(book) : null;
  const price = item.price ?? item.unitPrice ?? book?.price ?? "—";

  return (
    <div className="bg-surface-container-lowest border border-surface-variant p-4 flex items-center gap-6">
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="w-16 h-24 object-cover border border-outline-variant flex-shrink-0" />
      ) : (
        <div className="w-16 h-24 bg-surface-variant border border-outline-variant flex items-center justify-center text-secondary flex-shrink-0">
          <FiBook />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="headline-sm text-primary truncate">{title}</p>
        {book && <p className="body-md text-secondary mt-1 truncate">{author}</p>}
        <p className="body-md text-secondary mt-2">Quantity: {item.quantity ?? item.qty ?? 1}</p>
      </div>
      <p className="headline-sm text-primary whitespace-nowrap">ETB {price}</p>
    </div>
  );
}

function OrderDetailModal({ order, onClose }) {
  const formatDate = (value) => value ? new Date(value).toLocaleString() : "—";
  const [storeInfo, setStoreInfo] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);

  useEffect(() => {
    if (order?.storeId) {
      api.get(`/stores/public/${order.storeId}`)
        .then(res => setStoreInfo(unwrapItem(res)))
        .catch(() => { });
    }
    if (order?.branchId) {
      api.get(`/stores/me/branch/public/${order.branchId}`)
        .then(res => setBranchInfo(unwrapItem(res)))
        .catch(() => { });
    }
  }, [order]);

  return (
    <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-background border border-surface-variant shadow-elevation-3 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-variant">
          <div>
            <h2 className="display-sm text-primary">Order Details</h2>
            <p className="body-md text-secondary mt-2">Order #{order.id?.slice(0, 8)} · {formatDate(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>


        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2">
          <div className="bg-surface-container-lowest border border-surface-variant p-6">
            <p className="label-md text-secondary uppercase tracking-wider">Shipping Address</p>
            <p className="body-lg text-primary mt-2">{order.shippingAddress || "—"}</p>
          </div>
          <div className="bg-surface-container-lowest border border-surface-variant p-6">
            <p className="label-md text-secondary uppercase tracking-wider">Delivery PIN</p>
            <p className="body-lg text-primary mt-2">{order.deliveryPin || "Not issued"}</p>
          </div>
          <div className="bg-surface-container-lowest border border-surface-variant p-6">
            <p className="label-md text-secondary uppercase tracking-wider">PIN Used</p>
            <p className="body-lg text-primary mt-2">{order.deliveryPinUsed ? "Yes" : "No"}</p>
          </div>
          <div className="bg-surface-container-lowest border border-surface-variant p-6">
            <p className="label-md text-secondary uppercase tracking-wider">Stripe Payment ID</p>
            <p className="body-lg text-primary mt-2 break-all">{order.stripePaymentId || "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2">
          <div className="bg-surface-container-lowest border border-surface-variant p-6">
            <p className="label-md text-secondary uppercase tracking-wider">Branch Details</p>
            <p className="body-lg text-primary mt-2">
              {branchInfo ? branchInfo.branchName : (order.branchId || "—")}
            </p>
            {branchInfo && (
              <div className="body-md text-secondary mt-1">
                <p>{branchInfo.city}, {branchInfo.region}</p>
                {branchInfo.phone && <p className="flex items-center gap-2"><FiPhone /> {branchInfo.phone}</p>}
              </div>
            )}
          </div>
          <div className="bg-surface-container-lowest border border-surface-variant p-6">
            <p className="label-md text-secondary uppercase tracking-wider">Store Info</p>
            <p className="body-lg text-primary mt-2">
              {storeInfo ? storeInfo.storeName : (order.storeId || "—")}
            </p>
            {storeInfo && (
              <div className="body-md text-secondary mt-1">
                {storeInfo.email && <p className="flex items-center gap-2"><FiMail /> {storeInfo.email}</p>}
                {storeInfo.phone && <p className="flex items-center gap-2"><FiPhone /> {storeInfo.phone}</p>}
              </div>
            )}
          </div>
        </div>

        {order.items?.length > 0 && (
          <div className="mb-8">
            <p className="label-md text-secondary uppercase tracking-wider mb-4 border-b border-surface-variant pb-2">Order Items</p>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <OrderItemRow key={item.id ?? index} item={item} index={index} />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full btn-primary py-4 label-md"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function EditProfileModal({ user, profile, onClose, onSave }) {
  const [form, setForm] = useState({
    name: profile?.name || user?.name || "",
    phone: profile?.phone || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/users/profile", form);
      onSave(form);
      onClose();
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-background border border-surface-variant shadow-elevation-3 p-8 w-full max-w-sm rounded-sm">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-variant">
          <h2 className="display-sm text-primary">Edit Profile</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block label-md text-secondary uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant focus:border-primary text-primary body-md outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block label-md text-secondary uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant focus:border-primary text-primary body-md outline-none transition-colors"
              placeholder="+251 912 345 678"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 label-md disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [modalOrder, setModalOrder] = useState(null);
  const [modalLoadingId, setModalLoadingId] = useState(null);
  const [modalError, setModalError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [refundOrder, setRefundOrder] = useState(null);

  useEffect(() => {
    // Fetch profile
    api.get("/users/me")
      .then((res) => setProfile(unwrapItem(res)))
      .catch(() => { });

    // Fetch orders
    api.get("/orders")
      .then((res) => setOrders(unwrapList(res)))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, []);

  const totalSpent = orders
    .filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  const fetchOrderModal = async (orderId) => {
    setModalLoadingId(orderId);
    setModalError("");

    try {
      const res = await api.get(`/orders/${orderId}`);
      const orderDetails = unwrapItem(res);
      setModalOrder(orderDetails);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to load order details.");
    } finally {
      setModalLoadingId(null);
    }
  };

  const fetchTrackOrderModal = async (orderId) => {
    setModalLoadingId(orderId);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setTrackingOrder(unwrapItem(res));
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to load tracking.");
    } finally {
      setModalLoadingId(null);
    }
  };

  const handleTrackOrder = (orderId) => {
    fetchTrackOrderModal(orderId);
  };

  const handleViewDetails = (orderId) => {
    fetchOrderModal(orderId);
  };

  const handlePayOrder = (order) => {
    setPaymentOrder(order);
  };

  const handlePaymentComplete = (orderId) => {
    // Optimistically update order status to PAID in the list
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "PAID" } : o))
    );
  };

  const handleRequestRefund = (order) => {
    setRefundOrder(order);
  };

  const handleRefunded = (orderId) => {
    // Optimistically update order status to CANCELLED in the list
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED", paymentStatus: "REFUNDED" } : o))
    );
  };

  const TABS = [
    { id: "orders", label: "My Orders", count: orders.length },
    { id: "profile", label: "Profile" },
    { id: "store", label: "Become a Store" },
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased pt-24 pb-16">
      <Navbar hideDashboardButton={true} />

      <div className="max-w-7xl mx-auto px-8 w-full mt-8">

        {/* Profile Header */}
        <div className="bg-surface-container-lowest border border-surface-variant p-8 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-8 shadow-elevation-1">
          <div className="w-24 h-24 rounded-full bg-primary text-on-primary border-2 border-outline-variant flex items-center justify-center text-3xl font-bold select-none flex-shrink-0">
            {getInitials(profile?.name || user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="display-md text-primary mb-2">
              {profile?.name || user?.name}
            </h1>
            <p className="body-lg text-secondary">{user?.email}</p>
            <div className="flex items-center gap-4 mt-4 border-t border-surface-variant pt-4">
              <span className="label-md tracking-wider text-primary uppercase">
                Reader Role
              </span>
              {profile?.phone && (
                <span className="body-md text-secondary border-l border-outline-variant pl-4">{profile.phone}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditingProfile(true)}
            className="btn-secondary px-6 py-3 label-md flex-shrink-0"
          >
            Edit Profile
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<FiBox />} label="Total Orders" value={orders.length} />
          <StatCard icon={<FiCheckCircle />} label="Delivered" value={orders.filter(o => o.status === "DELIVERED").length} />
          <StatCard icon={<FiTruck />} label="In Progress" value={orders.filter(o => ["PENDING", "PAID", "SHIPPED"].includes(o.status)).length} />
          <StatCard icon={<FiDollarSign />} label="Total Spent" value={`ETB ${totalSpent.toLocaleString()}`} />
        </div>

        {/* Tabs - Modern Literary Style */}
        <div className="flex gap-8 overflow-x-auto no-scrollbar pb-4 mb-8 border-b border-surface-variant">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap transition-colors pb-2 flex items-center gap-2 ${activeTab === tab.id
                  ? "text-primary font-bold label-md border-b-2 border-primary"
                  : "text-secondary hover:text-primary font-medium label-md border-b-2 border-transparent"
                }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? "bg-primary text-on-primary" : "bg-surface-variant text-secondary"
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="flex flex-col gap-6">
            {modalError && (
              <div className="bg-error/10 border border-error/20 p-4 text-error body-md flex items-center gap-3">
                <span><FiAlertTriangle /></span> {modalError}
              </div>
            )}

            {loadingOrders ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-surface-variant border border-outline-variant p-6 h-32 animate-pulse" />
              ))
            ) : orders.length === 0 ? (
              <div className="bg-surface-container-lowest border border-surface-variant p-16 text-center shadow-elevation-1">
                <p className="text-5xl mb-6 opacity-80 flex justify-center"><FiInbox /></p>
                <p className="headline-md text-primary mb-2">Your library is empty</p>
                <p className="body-lg text-secondary mb-8 max-w-md mx-auto">Browse our curated collection and place your first order.</p>
                <button
                  onClick={() => navigate("/")}
                  className="btn-primary px-8 py-3 label-md"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onTrack={handleTrackOrder}
                  onDetails={handleViewDetails}
                  onPay={handlePayOrder}
                  onRefund={handleRequestRefund}
                  isLoading={modalLoadingId === order.id}
                />
              ))
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-surface-container-lowest border border-surface-variant p-8 shadow-elevation-1 max-w-3xl">
            <h2 className="headline-md text-primary mb-8 pb-4 border-b border-surface-variant">
              Account Archives
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
              {[
                { label: "Full Name", value: profile?.name || user?.name },
                { label: "Email Address", value: user?.email },
                { label: "Phone Number", value: profile?.phone || "Not set" },
                { label: "Account Role", value: "Reader (ROLE_USER)" },
                { label: "Member Since", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—" },
                { label: "Keycloak ID", value: user?.id?.slice(0, 16) + "..." },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-2">
                  <p className="label-md text-secondary uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="body-lg text-primary">{item.value}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditingProfile(true)}
              className="mt-12 btn-secondary px-8 py-3 label-md"
            >
              Edit Details
            </button>
          </div>
        )}

        {/* Become a Store Tab */}
        {activeTab === "store" && (
          <div className="bg-surface-container-lowest border border-surface-variant p-12 text-center shadow-elevation-1">
            <div className="w-24 h-24 bg-surface-variant border border-outline-variant rounded-full flex items-center justify-center text-4xl mx-auto mb-8">
              <FiHome />
            </div>
            <h2 className="display-sm text-primary mb-4">
              Curate Your Own Collection
            </h2>
            <p className="body-lg text-secondary max-w-xl mx-auto leading-relaxed mb-12">
              Register your bookstore on The Inkwell ecosystem and share your literary finds with thousands of readers.
            </p>

            {/* Plan comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto mb-12 text-left">
              {[
                {
                  name: "Free Plan",
                  commission: "5% commission per sale",
                  fee: "No monthly fee",
                  analytics: "Basic analytics",
                  support: "Standard support",
                  color: "border-outline-variant",
                },
                {
                  name: "Premium Plan",
                  commission: "2% commission per sale",
                  fee: "Monthly fee applies",
                  analytics: "Advanced analytics",
                  support: "Priority support",
                  color: "border-primary bg-primary/5",
                  highlight: true,
                },
              ].map((plan) => (
                <div key={plan.name} className={`border p-6 shadow-elevation-1 ${plan.color}`}>
                  <p className={`headline-sm mb-4 ${plan.highlight ? "text-primary" : "text-primary"}`}>
                    {plan.name}
                  </p>
                  {[plan.commission, plan.fee, plan.analytics, plan.support].map((f) => (
                    <p key={f} className="body-md text-secondary flex items-center gap-3 mb-2">
                      <span className={plan.highlight ? "text-primary" : "text-secondary"}><FiCheck /></span>
                      {f}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/store/apply")}
              className="btn-primary px-10 py-4 label-md"
            >
              Apply to Become a Store
            </button>
          </div>
        )}

      </div>

      {/* Modals */}
      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onPaid={handlePaymentComplete}
        />
      )}

      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onRefunded={(orderId) => {
            handleRefunded(orderId);
            setRefundOrder(null);
          }}
        />
      )}

      {modalOrder && (
        <OrderDetailModal
          order={modalOrder}
          onClose={() => setModalOrder(null)}
        />
      )}

      {trackingOrder && (
        <OrderTrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}

      {editingProfile && (
        <EditProfileModal
          user={user}
          profile={profile}
          onClose={() => setEditingProfile(false)}
          onSave={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  );
}
