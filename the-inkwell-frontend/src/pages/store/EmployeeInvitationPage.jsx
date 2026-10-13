import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { unwrapItem } from "../../utils/apiHelpers";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { FiAlertCircle, FiCheck, FiMap, FiArrowRight } from "react-icons/fi";

export default function EmployeeInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [store, setStore] = useState(null);
  const [branch, setBranch] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        // Fetch invitation details
        const invRes = await api.get(`/users/invitations/${token}`);
        const invData = unwrapItem(invRes);
        setInvitation(invData);

        if (invData.status !== "PENDING") {
          setError(`This invitation is already ${invData.status.toLowerCase()}.`);
          setLoading(false);
          return;
        }

        // Fetch store details
        if (invData.storeId) {
          try {
            const storeRes = await api.get(`/stores/public/${invData.storeId}`, { skipAuth: true });
            setStore(unwrapItem(storeRes));
          } catch (e) {
            console.error("Failed to fetch store details", e);
          }
        }

        // Fetch branch details
        if (invData.branchId) {
          try {
            const branchRes = await api.get(`/stores/me/branch/public/${invData.branchId}`, { skipAuth: true });
            setBranch(unwrapItem(branchRes));
          } catch (e) {
            console.error("Failed to fetch branch details", e);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load invitation. It may be invalid or expired.");
        setLoading(false);
      }
    };

    fetchDetails();
  }, [token]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.post(`/users/invitations/${token}/confirm`);
      setSuccess(true);
      setTimeout(() => {
        navigate("/employee/dashboard"); // Or wherever the employee should go
      }, 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to confirm invitation. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full bg-white rounded-xl shadow-elevation-2 p-8 border border-outline-variant/30 text-center relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-container"></div>
          
          {error ? (
            <div className="py-8">
              <FiAlertCircle className="w-16 h-16 mx-auto text-error mb-4" />
              <h2 className="headline-sm font-bold text-on-surface mb-2">Invitation Error</h2>
              <p className="body-md text-on-surface-variant mb-6">{error}</p>
              <button
                onClick={() => navigate("/")}
                className="btn-primary w-full"
              >
                Return Home
              </button>
            </div>
          ) : success ? (
            <div className="py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="headline-sm font-bold text-on-surface mb-2">Welcome to the Team!</h2>
              <p className="body-md text-on-surface-variant mb-6">
                You have successfully joined {store?.storeName || "the store"}. You are being redirected to your dashboard...
              </p>
              <button
                onClick={() => navigate("/employee/dashboard")}
                className="btn-primary w-full"
              >
                Go to Dashboard <FiArrowRight className="inline ml-2" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="headline-md font-display text-primary mb-2">Store Invitation</h1>
              <p className="body-md text-on-surface-variant mb-8">
                You've been invited to join a bookstore team on our platform.
              </p>

              <div className="bg-surface rounded-lg p-5 text-left mb-8 border border-outline-variant/50">
                <div className="mb-4">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">Store Name</h3>
                  <p className="body-lg font-semibold text-on-surface">
                    {store?.storeName || "Loading..."}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1 flex items-center gap-1">
                    <FiMap className="w-3.5 h-3.5" /> Branch
                  </h3>
                  <p className="body-md text-on-surface">
                    {branch?.branchName || "Loading..."}
                  </p>
                  {branch?.city && (
                    <p className="caption text-on-surface-variant mt-0.5">
                      {branch.address}, {branch.city}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1 flex items-center gap-1">
                    Role
                  </h3>
                  <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold mt-1">
                    {invitation?.role === "BRANCH_MANAGER" ? "Branch Manager" : "Worker"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {confirming ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>Accept Invitation <FiCheck className="w-5 h-5" /></>
                  )}
                </button>
                <button
                  onClick={() => navigate("/")}
                  disabled={confirming}
                  className="w-full py-3 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Decline & Return Home
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
