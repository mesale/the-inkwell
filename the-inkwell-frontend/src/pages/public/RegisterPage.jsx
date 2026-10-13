import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/useAuth";
import { FiAlertTriangle, FiCheck } from "react-icons/fi";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Full name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "Enter a valid email";
    if (!form.phone.trim()) errors.phone = "Phone number is required";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 8) errors.password = "Password must be at least 8 characters";
    if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";
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
      await api.post("/users/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      // Registration successful — redirect to login (Keycloak)
      navigate("/register-success");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-body-md antialiased pt-20 lg:pt-0">

      {/* Absolute Navbar for mobile */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-surface-variant px-8 h-20 flex items-center">
        <Link to="/" className="font-display font-bold text-2xl text-primary tracking-tight">
          The<span className="italic text-secondary font-medium ml-1">Inkwell.</span>
        </Link>
      </div>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 bg-surface-variant flex-col items-center justify-center px-12 relative overflow-hidden border-r border-surface-variant">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        {/* Logo */}
        <div className="relative z-10 text-center">
          <h1 className="font-display font-bold text-6xl text-primary tracking-tight">
            The<span className="italic text-secondary font-medium ml-2">Inkwell.</span>
          </h1>
          <p className="text-secondary mt-6 text-lg max-w-sm leading-relaxed mx-auto">
            Your literary marketplace for discovering rare and curated books across Ethiopia.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-16 grid grid-cols-2 gap-8 w-full max-w-sm">
          {[
            { value: "500+", label: "Curated Collections" },
            { value: "10K+", label: "Archived Titles" },
            { value: "50K+", label: "Avid Readers" },
            { value: "Free", label: "Library Access" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface/50 border border-outline-variant/30 p-6 text-center shadow-elevation-1">
              <p className="text-primary font-bold display-sm">{stat.value}</p>
              <p className="text-secondary label-md uppercase tracking-wider mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-[560px] xl:w-[640px] bg-background flex flex-col justify-center px-8 sm:px-16 py-12 overflow-y-auto">

        <h2 className="display-sm text-primary">Join the Archive</h2>
        <p className="text-secondary body-lg mt-2 mb-10 pb-8 border-b border-surface-variant">
          Establish your reader profile today.
        </p>

        {/* Global error */}
        {error && (
          <div className="bg-error/10 border border-error/20 p-4 text-error body-md mb-8 flex items-center gap-3">
            <span><FiAlertTriangle /></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Full Name */}
          <div>
            <label className="block label-md text-secondary uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Abebe Girma"
              className={`w-full px-4 py-3 border text-primary body-md bg-surface outline-none transition-colors ${fieldErrors.name
                ? "border-error focus:border-error"
                : "border-outline-variant focus:border-primary"
                }`}
            />
            {fieldErrors.name && (
              <p className="text-error body-md mt-2">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block label-md text-secondary uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="abebe@email.com"
              className={`w-full px-4 py-3 border text-primary body-md bg-surface outline-none transition-colors ${fieldErrors.email
                ? "border-error focus:border-error"
                : "border-outline-variant focus:border-primary"
                }`}
            />
            {fieldErrors.email && (
              <p className="text-error body-md mt-2">{fieldErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block label-md text-secondary uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              <div className="flex items-center bg-surface border border-outline-variant px-4 body-md text-secondary font-medium whitespace-nowrap">
                🇪🇹 +251
              </div>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="912 345 678"
                className={`flex-1 px-4 py-3 border text-primary body-md bg-surface outline-none transition-colors ${fieldErrors.phone
                  ? "border-error focus:border-error"
                  : "border-outline-variant focus:border-primary"
                  }`}
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-error body-md mt-2">{fieldErrors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block label-md text-secondary uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              className={`w-full px-4 py-3 border text-primary body-md bg-surface outline-none transition-colors ${fieldErrors.password
                ? "border-error focus:border-error"
                : "border-outline-variant focus:border-primary"
                }`}
            />
            {fieldErrors.password && (
              <p className="text-error body-md mt-2">{fieldErrors.password}</p>
            )}
            {/* Password strength indicator */}
            {form.password && (
              <div className="flex gap-1 mt-3">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 transition-colors ${form.password.length >= level * 3
                      ? level <= 1 ? "bg-error"
                        : level <= 2 ? "bg-amber-400"
                          : level <= 3 ? "bg-blue-400"
                            : "bg-primary"
                      : "bg-surface-variant"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block label-md text-secondary uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={`w-full px-4 py-3 border text-primary body-md bg-surface outline-none transition-colors ${fieldErrors.confirmPassword
                ? "border-error focus:border-error"
                : form.confirmPassword && form.password === form.confirmPassword
                  ? "border-primary"
                  : "border-outline-variant focus:border-primary"
                }`}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-error body-md mt-2">{fieldErrors.confirmPassword}</p>
            )}
            {form.confirmPassword && form.password === form.confirmPassword && (
              <p className="text-primary body-md mt-2 flex items-center gap-2"><FiCheck /> Signatures match</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 label-md disabled:opacity-60 flex items-center justify-center gap-3 mt-6"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registering...
              </>
            ) : (
              "Create Account"
            )}
          </button>

        </form>

        {/* Login link */}
        <p className="text-center body-md text-secondary mt-10 pt-8 border-t border-surface-variant">
          Already cataloged in the system?{" "}
          <button
            onClick={() => { login(); navigate("/"); }}
            className="text-primary font-bold hover:underline label-md"
          >
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}
