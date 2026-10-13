import { useCallback, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import api from "../../api/axiosInstance";
import { unwrapItem } from "../../utils/apiHelpers";
import { getBookImageUrl } from "../../utils/book.js";
import { FiCheck, FiAlertTriangle, FiShoppingCart, FiLock } from "react-icons/fi";

const STEPS = ["Delivery", "Review", "Payment"];
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function PaymentSuccess({ orders, navigate }) {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mb-5 border border-green-200">
        <FiCheck />
      </div>
      <h2 className="font-display font-bold text-on-surface text-xl mb-2">
        All Payments Complete!
      </h2>
      <p className="text-on-surface-variant text-sm mb-6 max-w-md">
        Your {orders.length} {orders.length === 1 ? "order has" : "orders have"} been successfully created and paid.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="btn-primary px-8 py-3 label-md"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

function StripePaymentForm({ amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setSubmitting(true);
    setPaymentError("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {amount && (
        <div className="flex justify-between items-center bg-surface border border-surface-variant p-3">
          <span className="text-xs uppercase tracking-wider text-secondary">Pay Amount</span>
          <span className="font-bold text-primary font-mono text-base">ETB {amount}</span>
        </div>
      )}

      <PaymentElement />

      {paymentError && (
        <div className="bg-error/10 border border-error/20 px-4 py-3 text-error text-sm flex gap-2 items-center">
          <FiAlertTriangle /> {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full bg-primary text-white rounded-lg py-3.5 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing payment...
          </>
        ) : "Pay for Current Order"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdOrders, setCreatedOrders] = useState([]);
  const [currentPayOrderIndex, setCurrentPayOrderIndex] = useState(0);
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(null);

  const [address, setAddress] = useState({
    fullName: user?.name || "",
    phone: "",
    region: "",
    city: "",
    specificAddress: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // Group cart items by branchId
  const branchGroups = cartItems.reduce((acc, item) => {
    const bId = item.branchId || "unknown";
    if (!acc[bId]) {
      acc[bId] = {
        branchId: bId,
        storeId: item.storeId || "unknown",
        items: [],
        total: 0,
      };
    }
    acc[bId].items.push(item);
    acc[bId].total += item.price * item.quantity;
    return acc;
  }, {});

  const groupedList = Object.values(branchGroups);

  const handleInitiatePayment = useCallback(async (orderId) => {
    setClientSecret("");
    setAmount(null);
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const paymentRes = await api.post(`/payments/checkout/${orderId}`);
        const data = paymentRes.data?.data;
        setClientSecret(data.stripeClientSecret);
        setAmount(data.amount);
        return; // Success
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          setError(err.response?.data?.message || "Failed to initiate payment.");
        } else {
          // Wait 800ms before retrying
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
  }, []);

  const validateAddress = () => {
    const errors = {};
    if (!address.fullName.trim()) errors.fullName = "Full name is required";
    if (!address.phone.trim()) errors.phone = "Phone number is required";
    if (!address.region.trim()) errors.region = "Region is required";
    if (!address.city.trim()) errors.city = "City is required";
    if (!address.specificAddress.trim()) errors.specificAddress = "Address is required";
    return errors;
  };

  const handleAddressNext = () => {
    const errors = validateAddress();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStep(1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const results = [];
      for (const group of groupedList) {
        const orderRes = await api.post("/orders", {
          branchId: group.branchId,
          storeId: group.storeId,
          shippingAddress: `${address.specificAddress}, ${address.city}, ${address.region}`,
          items: group.items.map(item => ({
            bookId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
        });
        results.push(unwrapItem(orderRes));
      }
      setCreatedOrders(results);
      clearCart();
      setStep(2);

      if (results.length > 0) {
        setCurrentPayOrderIndex(0);
        await handleInitiatePayment(results[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create orders.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Mark current order as paid in state
    setCreatedOrders(prev =>
      prev.map((o, idx) => (idx === currentPayOrderIndex ? { ...o, paymentStatus: "COMPLETED" } : o))
    );

    const nextIndex = currentPayOrderIndex + 1;
    if (nextIndex < createdOrders.length) {
      setCurrentPayOrderIndex(nextIndex);
      await handleInitiatePayment(createdOrders[nextIndex].id);
    } else {
      // All orders have been paid
      setCurrentPayOrderIndex(createdOrders.length);
    }
  };

  const allPaymentsDone = createdOrders.length > 0 && currentPayOrderIndex >= createdOrders.length;
  const currentPayOrder = createdOrders[currentPayOrderIndex];

  // Redirect if cart is empty and we haven't created orders yet
  if (cartItems.length === 0 && createdOrders.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 text-on-surface">
        <Navbar />
        <p className="text-5xl flex justify-center text-secondary"><FiShoppingCart /></p>
        <p className="font-display font-bold text-xl">Your cart is empty</p>
        <button
          onClick={() => navigate("/")}
          className="btn-primary"
        >
          Browse Books
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-24">

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${i < step ? "bg-primary text-on-primary"
                  : i === step ? "bg-primary text-on-primary"
                    : "bg-surface-variant text-secondary border border-outline-variant"
                  }`}>
                  {i < step ? <FiCheck /> : i + 1}
                </div>
                <span className={`text-xs font-semibold ${i === step ? "text-primary" : "text-secondary"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-4 transition-colors ${i < step ? "bg-primary" : "bg-outline-variant"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — Step Content */}
          <div className="lg:col-span-2">

            {/* STEP 0 — Delivery Address */}
            {step === 0 && (
              <div className="bg-white rounded-lg shadow-elevation-1 p-6 border border-surface-variant">
                <h2 className="font-display font-bold text-xl mb-6 text-primary">
                  Delivery Address
                </h2>

                <div className="flex flex-col gap-4">

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2 font-sans">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className={`w-full px-4 py-3 rounded-md border-2 text-sm bg-surface outline-none transition-colors ${fieldErrors.fullName ? "border-error" : "border-outline-variant focus:border-primary"
                        }`}
                      placeholder="Abebe Girma"
                    />
                    {fieldErrors.fullName && <p className="text-error text-xs mt-1">{fieldErrors.fullName}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2 font-sans">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center bg-surface border-2 border-outline-variant rounded-md px-3 text-sm text-secondary font-medium whitespace-nowrap">
                        🇪🇹 +251
                      </div>
                      <input
                        type="tel"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        className={`flex-1 px-4 py-3 rounded-md border-2 text-sm bg-surface outline-none transition-colors ${fieldErrors.phone ? "border-error" : "border-outline-variant focus:border-primary"
                          }`}
                        placeholder="912 345 678"
                      />
                    </div>
                    {fieldErrors.phone && <p className="text-error text-xs mt-1">{fieldErrors.phone}</p>}
                  </div>

                  {/* Region */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2 font-sans">
                      Region / Kilil
                    </label>
                    <select
                      value={address.region}
                      onChange={(e) => setAddress({ ...address, region: e.target.value })}
                      className={`w-full px-4 py-3 rounded-md border-2 text-sm bg-surface outline-none transition-colors ${fieldErrors.region ? "border-error" : "border-outline-variant focus:border-primary"
                        }`}
                    >
                      <option value="">Select region...</option>
                      {[
                        "Addis Ababa", "Oromia", "Amhara", "Tigray",
                        "SNNPR", "Somali", "Afar", "Benishangul-Gumuz",
                        "Gambela", "Harari", "Dire Dawa",
                      ].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {fieldErrors.region && <p className="text-error text-xs mt-1">{fieldErrors.region}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2 font-sans">
                      City / Woreda
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className={`w-full px-4 py-3 rounded-md border-2 text-sm bg-surface outline-none transition-colors ${fieldErrors.city ? "border-error" : "border-outline-variant focus:border-primary"
                        }`}
                      placeholder="e.g. Bole, Kirkos"
                    />
                    {fieldErrors.city && <p className="text-error text-xs mt-1">{fieldErrors.city}</p>}
                  </div>

                  {/* Specific Address */}
                  <div>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-2 font-sans">
                      Specific Address
                    </label>
                    <textarea
                      value={address.specificAddress}
                      onChange={(e) => setAddress({ ...address, specificAddress: e.target.value })}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-md border-2 text-sm bg-surface outline-none transition-colors resize-none ${fieldErrors.specificAddress ? "border-error" : "border-outline-variant focus:border-primary"
                        }`}
                      placeholder="Street name, building, landmark..."
                    />
                    {fieldErrors.specificAddress && <p className="text-error text-xs mt-1">{fieldErrors.specificAddress}</p>}
                  </div>

                  <button
                    onClick={handleAddressNext}
                    className="w-full bg-primary text-white rounded-lg py-3.5 font-semibold text-sm hover:opacity-90 transition-opacity mt-2"
                  >
                    Continue to Review →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 1 — Review Order */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-elevation-1 p-6 border border-surface-variant">
                <h2 className="font-display font-bold text-xl mb-6 text-primary">
                  Review Your Orders
                </h2>

                {/* Show items grouped by branch */}
                <div className="flex flex-col gap-6 mb-6">
                  {groupedList.map((group, idx) => (
                    <div key={group.branchId} className="border border-surface-variant p-4 rounded-sm bg-surface-container-lowest">
                      <div className="border-b border-surface-variant pb-2 mb-3">
                        <h4 className="text-xs uppercase tracking-wider text-secondary font-bold font-sans">
                          Shipment {idx + 1} of {groupedList.length} (Branch: {group.branchId.slice(0, 8)})
                        </h4>
                      </div>
                      <div className="flex flex-col gap-4">
                        {group.items.map(item => (
                          <div key={item.id} className="flex gap-4">
                            <img
                              src={getBookImageUrl(item) || "https://placehold.co/48x64?text=Book"}
                              alt={item.title}
                              className="w-12 h-16 object-cover rounded-sm flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-primary text-sm truncate">{item.title}</p>
                              <p className="text-secondary text-xs mt-0.5">by {item.author} · Quantity: {item.quantity}</p>
                              <p className="text-primary font-bold text-sm mt-1 font-mono">ETB {item.price * item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-2 border-t border-surface-variant flex justify-between items-center text-sm">
                        <span className="text-secondary">Shipment Subtotal</span>
                        <span className="font-bold text-primary font-mono">ETB {group.total}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Address Summary */}
                <div className="border-2 border-surface-variant bg-surface-container-lowest rounded-sm p-4 mb-6">
                  <div className="flex items-center justify-between mb-3 border-b border-surface-variant pb-2">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wide font-sans">
                      Delivery To
                    </p>
                    <button
                      onClick={() => setStep(0)}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-primary">{address.fullName}</p>
                  <p className="text-sm text-secondary mt-0.5">+251 {address.phone}</p>
                  <p className="text-sm text-secondary mt-0.5">
                    {address.specificAddress}, {address.city}, {address.region}
                  </p>
                </div>

                {/* PIN notice */}
                <div className="bg-surface border-2 border-amber-200 rounded-sm p-4 mb-6 flex gap-3">
                  <span className="text-xl text-amber-600"><FiLock /></span>
                  <div>
                    <p className="text-sm font-semibold text-primary">How delivery confirmation works</p>
                    <p className="text-xs text-secondary mt-1 leading-relaxed font-sans">
                      After your order is shipped, you'll receive a unique PIN code in your dashboard. Share it with the delivery person when your book arrives — this confirms delivery and releases payment to the store.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-error/10 border border-error/20 rounded-sm px-4 py-3 text-error text-sm mb-4 flex gap-2 items-center">
                    <FiAlertTriangle /> {error}
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-primary text-white rounded-lg py-3.5 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating orders...
                    </>
                  ) : "Place Orders & Pay →"}
                </button>
              </div>
            )}

            {/* STEP 2 — Payment */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-elevation-1 p-6 border border-surface-variant">
                {allPaymentsDone ? (
                  <PaymentSuccess orders={createdOrders} navigate={navigate} />
                ) : (
                  <>
                    <h2 className="font-display font-bold text-xl mb-2 text-primary">
                      Complete Payment
                    </h2>
                    <p className="text-secondary text-sm mb-6 font-sans">
                      Your orders have been created. Please complete payment for each shipment.
                    </p>

                    {/* Orders Status List */}
                    <div className="flex flex-col gap-3 mb-6 bg-surface p-4 border border-surface-variant">
                      <p className="label-md text-secondary uppercase tracking-wider font-sans">Shipment Payments</p>
                      {createdOrders.map((ord, idx) => {
                        const isCurrent = idx === currentPayOrderIndex;
                        const isPaid = ord.paymentStatus === "COMPLETED";
                        return (
                          <div key={ord.id} className="flex justify-between items-center text-sm py-2 border-b border-surface-variant last:border-0 font-sans">
                            <div className="flex flex-col">
                              <span className={`font-semibold ${isCurrent ? "text-primary" : "text-secondary"}`}>
                                Order #{ord.id.slice(0, 8)} {isCurrent && "(Current)"}
                              </span>
                              <span className="text-xs text-secondary">
                                Branch: {ord.branchId.slice(0, 8)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-primary font-mono">ETB {ord.totalPrice}</span>
                              {isPaid ? (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 font-semibold border border-green-200">Paid</span>
                              ) : (
                                <span className={`text-xs px-2 py-0.5 rounded-sm font-semibold border ${isCurrent ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse" : "bg-surface-variant text-secondary border-outline-variant"}`}>
                                  {isCurrent ? "Paying" : "Pending"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {clientSecret ? (
                      <Elements
                        key={currentPayOrder?.id}
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: "stripe",
                            variables: {
                              colorPrimary: "#E63946",
                              borderRadius: "4px",
                              fontFamily: "DM Sans, sans-serif",
                            },
                          },
                        }}
                      >
                        <StripePaymentForm
                          amount={amount}
                          onSuccess={handlePaymentSuccess}
                        />
                      </Elements>
                    ) : (
                      /* Waiting for clientSecret */
                      <div className="flex flex-col items-center justify-center py-12 gap-4 text-secondary">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-medium">Setting up secure payment...</p>
                        {error && (
                          <div className="bg-error/10 border border-error/20 rounded-sm px-4 py-3 text-error text-sm flex gap-2 items-center">
                            <FiAlertTriangle /> {error}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => navigate("/dashboard")}
                      className="w-full text-secondary text-sm mt-6 hover:text-primary transition-colors py-2 font-semibold font-sans"
                    >
                      Pay remaining orders later from dashboard
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-elevation-1 p-5 border border-surface-variant sticky top-24">
              <h3 className="font-display font-bold text-base mb-4 text-primary">
                Order Summary
              </h3>

              {/* Items List */}
              <div className="flex flex-col gap-3 mb-5 pb-5 border-b border-surface-variant max-h-60 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={getBookImageUrl(item) || "https://placehold.co/48x64?text=Book"}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-sm flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-primary line-clamp-1 leading-tight">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-secondary mt-0.5">by {item.author}</p>
                      <p className="text-xs font-bold text-primary mt-1 font-mono">
                        ETB {item.price} x {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="flex flex-col gap-2.5 text-sm mb-5 pb-5 border-b border-surface-variant font-sans">
                <div className="flex justify-between">
                  <span className="text-secondary">Subtotal</span>
                  <span className="font-medium text-primary font-mono">ETB {cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Delivery</span>
                  <span className="font-medium text-green-600 font-sans">Free</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">Total</span>
                <span className="font-bold text-primary text-xl font-mono">ETB {cartTotal}</span>
              </div>

              {/* Security badge */}
              <div className="mt-5 flex items-center gap-2 text-[11px] text-secondary bg-surface rounded-sm p-3 border border-surface-variant font-sans">
                <FiLock className="flex-shrink-0" />
                <span>Secured by Stripe. Funds held in escrow until delivery.</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
