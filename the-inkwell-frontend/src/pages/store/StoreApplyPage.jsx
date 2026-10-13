import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import { unwrapItem } from "../../utils/apiHelpers";
import { FiLink, FiAlertTriangle, FiCheck } from "react-icons/fi";

// ─── Stage 1: Enter business email ───────────────────────────────────────────
function InitiateStage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Business email is required");
    setLoading(true);
    setError("");
    try {
      await api.post("/users/me/store-application/initiate", {
        businessEmail: email,
      });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full border border-primary flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="display-sm text-primary mb-4">Check your inbox</h2>
        <p className="body-lg text-secondary leading-relaxed max-w-sm mx-auto">
          We sent a registration link to <span className="font-semibold text-primary">{email}</span>.
          Click the link in the email to continue your application.
        </p>
        <p className="body-md text-secondary mt-8 pt-6 border-t border-surface-variant">
          Didn't receive it?{" "}
          <button
            onClick={() => setSent(false)}
            className="text-primary font-bold hover:underline label-md"
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="display-md text-primary mb-4">
        Join the Library
      </h2>
      <p className="body-lg text-secondary mb-12 leading-relaxed">
        Enter your business email address. We'll send you a secure link to curate your store profile.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block label-md text-secondary uppercase tracking-wider mb-2">
            Business Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="curator@bookstore.com"
            className={`w-full px-4 py-4 border text-primary body-md bg-surface outline-none transition-colors ${error ? "border-error" : "border-outline-variant focus:border-primary"
              }`}
          />
          {error && <p className="text-error body-md mt-2">{error}</p>}
        </div>

        <div className="bg-surface-variant border border-outline-variant p-6 text-secondary body-md leading-relaxed">
          <p className="headline-sm text-primary mb-2">What happens next?</p>
          A secure link will be sent to this email containing an encrypted token. It allows you to formalize your application and expires after 24 hours.
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-4 label-md disabled:opacity-60 flex items-center justify-center gap-3 mt-4"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Transmitting...
            </>
          ) : "Send Registration Link"}
        </button>
      </form>
    </div>
  );
}

// ─── Stage 2: Fill out application form (token from URL) ─────────────────────
function ApplicationFormStage({ token }) {
  const navigate = useNavigate();
  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    businessEmail: "",
    storeName: "",
    phone: "",
    address: "",
    city: "",
    description: "",
  });

  // Validate token on mount
  useEffect(() => {
    api.get(`/users/me/store-application/validate-token?token=${token}`)
      .then((res) => {
        const data = unwrapItem(res);
        // Pre-fill email if returned
        if (data?.businessEmail) {
          setForm((prev) => ({ ...prev, businessEmail: data.businessEmail }));
        }
      })
      .catch(() => {
        setTokenError("This invitation link is invalid or has expired. Please request a new one.");
      })
      .finally(() => setValidating(false));
  }, [token]);

  const validate = () => {
    const errors = {};
    if (!form.storeName.trim()) errors.storeName = "Store name is required";
    if (!form.phone.trim()) errors.phone = "Phone is required";
    if (!form.address.trim()) errors.address = "Address is required";
    if (!form.city.trim()) errors.city = "City is required";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/users/me/store-application/submit", {
        ...form,
        token,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  if (validating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-primary">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="headline-md">Authenticating invitation...</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="text-center py-12">
        <p className="text-6xl mb-6 opacity-60 flex justify-center"><FiLink /></p>
        <h2 className="display-sm text-primary mb-4">Link Expired</h2>
        <p className="body-lg text-secondary mb-10">{tokenError}</p>
        <button
          onClick={() => navigate("/store/apply")}
          className="btn-primary px-8 py-4 label-md"
        >
          Request New Link
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full border border-primary flex items-center justify-center mx-auto mb-8">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="display-sm text-primary mb-4">Application Registered</h2>
        <p className="body-lg text-secondary leading-relaxed max-w-md mx-auto mb-10">
          Your initial application has been logged. Check your business email for a secure link to upload your business documents.
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-secondary px-8 py-4 label-md"
        >
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="display-md text-primary mb-4">Store Profile</h2>
      <p className="body-lg text-secondary mb-10 border-b border-surface-variant pb-8">
        Formalize your bookstore's presence in the ecosystem.
      </p>

      {error && (
        <div className="bg-error/10 border border-error/20 p-4 text-error body-md flex gap-3 mb-8">
          <span><FiAlertTriangle /></span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Business Email (read-only if pre-filled) */}
        <div>
          <label className="block label-md text-secondary uppercase tracking-wider mb-2">
            Business Email
          </label>
          <input
            type="email"
            value={form.businessEmail}
            onChange={(e) => setField("businessEmail", e.target.value)}
            placeholder="store@business.com"
            className="w-full px-4 py-3 border border-outline-variant focus:border-primary text-primary body-md bg-surface outline-none transition-colors"
          />
        </div>

        {/* Store Name */}
        <div>
          <label className="block label-md text-secondary uppercase tracking-wider mb-2">
            Bookstore Identity
          </label>
          <input
            type="text"
            value={form.storeName}
            onChange={(e) => setField("storeName", e.target.value)}
            placeholder="e.g. The Grand Archive"
            className={`w-full px-4 py-3 border text-primary body-md bg-surface outline-none transition-colors ${fieldErrors.storeName ? "border-error" : "border-outline-variant focus:border-primary"
              }`}
          />
          {fieldErrors.storeName && <p className="text-error body-md mt-2">{fieldErrors.storeName}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block label-md text-secondary uppercase tracking-wider mb-2">
            Contact Number
          </label>
          <div className="flex gap-2">
            <div className="flex items-center bg-surface border border-outline-variant px-4 body-md text-secondary font-medium whitespace-nowrap">
              🇪🇹 +251
            </div>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="912 345 678"
              className={`flex-1 px-4 py-3 border text-primary body-md bg-surface outline-none transition-colors ${fieldErrors.phone ? "border-error" : "border-outline-variant focus:border-primary"
                }`}
            />
          </div>
          {fieldErrors.phone && <p className="text-error body-md mt-2">{fieldErrors.phone}</p>}
        </div>

        {/* City */}
        <div>
          <label className="block label-md text-secondary uppercase tracking-wider mb-2">
            District / City
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="e.g. Bole, Kirkos"
            className={`w-full px-4 py-3 border text-primary body-md bg-surface outline-none transition-colors ${fieldErrors.city ? "border-error" : "border-outline-variant focus:border-primary"
              }`}
          />
          {fieldErrors.city && <p className="text-error body-md mt-2">{fieldErrors.city}</p>}
        </div>

        {/* Address */}
        <div>
          <label className="block label-md text-secondary uppercase tracking-wider mb-2">
            Physical Address
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Street, building, landmark..."
            className={`w-full px-4 py-3 border text-primary body-md bg-surface outline-none transition-colors ${fieldErrors.address ? "border-error" : "border-outline-variant focus:border-primary"
              }`}
          />
          {fieldErrors.address && <p className="text-error body-md mt-2">{fieldErrors.address}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block label-md text-secondary uppercase tracking-wider mb-2">
            Curatorial Statement <span className="normal-case opacity-60 font-normal">(optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={4}
            placeholder="A brief philosophical or descriptive overview of your collection..."
            className="w-full px-4 py-3 border border-outline-variant focus:border-primary text-primary body-md bg-surface outline-none transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-4 label-md disabled:opacity-60 flex items-center justify-center gap-3 mt-6"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : "Submit Profile"}
        </button>
      </form>
    </div>
  );
}

// ─── Main page — decides which stage to show ──────────────────────────────────
export default function StoreApplyPage() {
  const [searchParams] = useSearchParams();
  const applicationToken = searchParams.get("token");

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row font-body-md antialiased pt-20 lg:pt-0">

      {/* Absolute Navbar for mobile (optional depending on global layout) */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-surface-variant px-8 h-20 flex items-center">
        <span className="font-display font-bold text-2xl text-primary tracking-tight">
          The<span className="italic text-secondary font-medium ml-1">Inkwell.</span>
        </span>
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-surface-variant flex-col items-center justify-center px-16 relative overflow-hidden border-r border-surface-variant">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        <div className="relative z-10 text-center mb-16">
          <h1 className="font-display font-bold text-6xl text-primary tracking-tight">
            The<span className="italic text-secondary font-medium ml-2">Inkwell.</span>
          </h1>
          <p className="text-secondary mt-6 text-lg max-w-md leading-relaxed">
            Curate your collection and join an exclusive ecosystem of discerning booksellers across Ethiopia.
          </p>
        </div>

        <div className="relative z-10 flex flex-col gap-6 w-full max-w-sm">
          {[
            { label: "Initiate Registration", done: !!applicationToken },
            { label: "Profile Architecture", done: false, active: !!applicationToken },
            { label: "Document Verification", done: false },
            { label: "Final Curation Review", done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border ${item.done ? "bg-primary text-on-primary border-primary"
                  : item.active ? "bg-primary text-on-primary border-primary"
                    : "bg-background text-secondary border-outline-variant"
                }`}>
                {item.done ? <FiCheck /> : i + 1}
              </div>
              <p className={`headline-sm ${item.done || item.active ? "text-primary" : "text-secondary"}`}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-[640px] xl:w-[720px] bg-background flex flex-col justify-center px-8 sm:px-16 py-16 overflow-y-auto">
        {applicationToken ? (
          <ApplicationFormStage token={applicationToken} />
        ) : (
          <InitiateStage />
        )}
      </div>
    </div>
  );
}
