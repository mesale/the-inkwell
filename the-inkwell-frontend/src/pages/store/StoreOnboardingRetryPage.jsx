import { useState } from "react";
import { FiAlertTriangle, FiRefreshCw, FiArrowRight, FiCopy, FiCheck } from "react-icons/fi";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosInstance";

export default function StoreOnboardingRetryPage() {
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      // Endpoint is /api/store/payments/onboarding-link
      // Our axios instance baseURL already contains /api or gateway URL prefix
      const res = await api.get("/payments/store/onboarding-link");
      const url = res.data?.data;
      if (url) {
        setNewUrl(url);
      } else {
        throw new Error("No onboarding URL returned from server.");
      }
    } catch (err) {
      console.error("Failed to regenerate onboarding link", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to generate a new onboarding link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (newUrl) {
      navigator.clipboard.writeText(newUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* fixed navbar matching the dashboard style */}
      <Navbar mode="dashboard" badgeText="Store" hideSearch />

      <main className="flex-1 flex items-center justify-center pt-28 pb-16 px-4 md:px-8">
        <div className="relative max-w-xl w-full">
          {/* Decorative premium background glows */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

          {/* Core Content Card */}
          <div className="bg-white border border-stone/60 shadow-elevation-3 rounded-lg p-8 md:p-12 text-center backdrop-blur-sm bg-white/95">
            {!newUrl ? (
              <>
                {/* Expired State */}
                <div className="w-20 h-20 mx-auto mb-6 bg-amber-50 border border-amber-200 text-amber-700 rounded-full flex items-center justify-center text-4xl shadow-sm">
                  <FiAlertTriangle className="animate-pulse" />
                </div>

                <h1 className="font-display font-bold text-3xl text-primary mb-4 leading-tight">
                  Onboarding Link Expired
                </h1>

                <p className="body-md text-on-surface-variant max-w-md mx-auto mb-8 leading-relaxed">
                  For security and compliance reasons, Stripe onboarding links expire after 7 days or after being accessed.
                  To connect your bookstore's payouts and start selling, please regenerate a new onboarding link.
                </p>

                {error && (
                  <div className="bg-error/5 border border-error/20 text-error rounded-md p-4 mb-6 text-sm flex gap-3 items-center justify-center">
                    <FiAlertTriangle className="flex-shrink-0 text-lg" />
                    <span className="text-left font-medium">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full btn-primary py-4 label-lg flex items-center justify-center gap-2 group transition-all duration-300 shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="animate-spin text-lg" />
                      <span>Generating link...</span>
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="text-lg group-hover:rotate-180 transition-transform duration-500" />
                      <span>Generate New Onboarding Link</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="w-20 h-20 mx-auto mb-6 bg-green-50 border border-green-200 text-green-700 rounded-full flex items-center justify-center text-4xl shadow-sm">
                  <FiCheck className="scale-125" />
                </div>

                <h1 className="font-display font-bold text-3xl text-primary mb-4 leading-tight">
                  New Link Generated!
                </h1>

                <p className="body-md text-on-surface-variant max-w-md mx-auto mb-8 leading-relaxed">
                  We've sent a new Stripe onboarding link to your store's business email.
                  You can also continue immediately by using the options below.
                </p>

                <div className="flex flex-col gap-4">
                  <a
                    href={newUrl}
                    className="w-full btn-primary py-4 label-lg flex items-center justify-center gap-2 group transition-all duration-300 shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5"
                  >
                    <span>Proceed to Stripe Onboarding</span>
                    <FiArrowRight className="text-lg group-hover:translate-x-1 transition-transform" />
                  </a>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCopy}
                      className="flex-1 btn-secondary py-3.5 label-md flex items-center justify-center gap-2 border border-outline hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <FiCheck className="text-green-700 text-lg" />
                          <span className="text-green-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <FiCopy className="text-lg" />
                          <span>Copy Onboarding URL</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setNewUrl("")}
                      className="btn-ghost py-3.5 px-6 label-md text-secondary hover:text-primary transition-colors border border-transparent hover:border-outline-variant"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
