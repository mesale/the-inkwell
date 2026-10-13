import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import { FiFileText, FiCheckCircle, FiMail, FiHome, FiAlertTriangle } from "react-icons/fi";

function CompleteProfileStage({ token }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    storeName: "", businessRegNumber: "", tin: "",
    region: "", city: "", address: "",
    bankName: "", bankAccount: "",
  });

  const [files, setFiles] = useState({
    ownerIdFile: null,
    businessLicenseFile: null,
  });

  const REGIONS = [
    "Addis Ababa", "Oromia", "Amhara", "Tigray",
    "SNNPR", "Somali", "Afar", "Benishangul-Gumuz", "Gambela", "Harari", "Dire Dawa",
  ];

  const BANKS = [
    "Commercial Bank of Ethiopia", "Awash Bank", "Dashen Bank",
    "Bank of Abyssinia", "Wegagen Bank", "United Bank", "Zemen Bank",
    "Oromia Cooperative Bank", "NIB International Bank", "Lion International Bank",
  ];

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!form.storeName.trim()) errors.storeName = "Required";
    if (!form.businessRegNumber.trim()) errors.businessRegNumber = "Required";
    if (!form.tin.trim()) errors.tin = "Required";
    if (!form.region.trim()) errors.region = "Required";
    if (!form.city.trim()) errors.city = "Required";
    if (!form.address.trim()) errors.address = "Required";
    if (!files.ownerIdFile) errors.ownerIdFile = "Owner ID is required";
    if (!files.businessLicenseFile) errors.businessLicenseFile = "Business license is required";
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
      const formData = new FormData();
      formData.append("data", new Blob([JSON.stringify(form)], { type: "application/json" }));
      formData.append("ownerIdFile", files.ownerIdFile);
      formData.append("businessLicenseFile", files.businessLicenseFile);

      await api.put(`/stores/me/complete-profile?token=${token}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display font-bold text-2xl text-on-surface mb-2">
          Profile Complete!
        </h2>
        <p className="text-on-surface-variant text-sm leading-relaxed max-w-sm mx-auto mb-6">
          Your store profile has been submitted for review. Our admin team will verify your documents and approve your store. You'll receive an email with your login credentials once approved.
        </p>
        <div className="bg-surface rounded-lg p-4 text-left max-w-sm mx-auto mb-6 text-xs text-on-surface-variant space-y-2">
          <p className="font-semibold text-on-surface text-sm mb-2">What happens next?</p>
          <p className="flex items-center gap-2"><FiFileText /> Admin reviews your documents</p>
          <p className="flex items-center gap-2"><FiCheckCircle /> Store gets approved</p>
          <p className="flex items-center gap-2"><FiMail /> You receive login credentials by email</p>
          <p className="flex items-center gap-2"><FiHome /> You can start listing books</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-container transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display font-bold text-2xl text-on-surface mb-2">
        Complete Store Profile
      </h2>
      <p className="text-on-surface-variant text-sm mb-8">
        Provide your official business details and upload required documents for verification.
      </p>

      {error && (
        <div className="bg-surface-variant border border-outline-variant rounded-md px-4 py-3 text-on-surface text-sm mb-5 flex gap-2">
          <span><FiAlertTriangle /></span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Business Identity */}
        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-primary text-white text-xs flex items-center justify-center">1</span>
            Business Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "storeName", label: "Official Store Name", placeholder: "e.g. Addis Book Centre PLC" },
              { key: "businessRegNumber", label: "Business Registration Number", placeholder: "From Ministry of Trade" },
              { key: "tin", label: "TIN Number", placeholder: "From ERCA" },
            ].map((f) => (
              <div key={f.key} className={f.key === "storeName" ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wide mb-2">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={`w-full px-4 py-3 rounded-md border-2 text-sm bg-surface outline-none transition-colors ${fieldErrors[f.key] ? "border-error" : "border-outline-variant focus:border-primary"
                    }`}
                />
                {fieldErrors[f.key] && <p className="text-error text-xs mt-1">{fieldErrors[f.key]}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Location */}
        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-primary text-white text-xs flex items-center justify-center">2</span>
            Business Location
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wide mb-2">Region / Kilil</label>
              <select
                value={form.region}
                onChange={(e) => setField("region", e.target.value)}
                className={`w-full px-4 py-3 rounded-md border-2 text-sm bg-surface outline-none transition-colors ${fieldErrors.region ? "border-error" : "border-outline-variant focus:border-primary"
                  }`}
              >
                <option value="">Select region...</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {fieldErrors.region && <p className="text-error text-xs mt-1">{fieldErrors.region}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wide mb-2">City / Woreda</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="e.g. Bole"
                className={`w-full px-4 py-3 rounded-md border-2 text-sm bg-surface outline-none transition-colors ${fieldErrors.city ? "border-error" : "border-outline-variant focus:border-primary"
                  }`}
              />
              {fieldErrors.city && <p className="text-error text-xs mt-1">{fieldErrors.city}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wide mb-2">Specific Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Street, building, landmark..."
                className={`w-full px-4 py-3 rounded-md border-2 text-sm bg-surface outline-none transition-colors ${fieldErrors.address ? "border-error" : "border-outline-variant focus:border-primary"
                  }`}
              />
              {fieldErrors.address && <p className="text-error text-xs mt-1">{fieldErrors.address}</p>}
            </div>
          </div>
        </section>

        {/* Banking */}
        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-primary text-white text-xs flex items-center justify-center">3</span>
            Banking & Payment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wide mb-2">Bank Name</label>
              <select
                value={form.bankName}
                onChange={(e) => setField("bankName", e.target.value)}
                className="w-full px-4 py-3 rounded-md border-2 border-outline-variant focus:border-primary text-sm bg-surface outline-none transition-colors"
              >
                <option value="">Select bank...</option>
                {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wide mb-2">Bank Account Number</label>
              <input
                type="text"
                value={form.bankAccount}
                onChange={(e) => setField("bankAccount", e.target.value)}
                placeholder="Your business account number"
                className="w-full px-4 py-3 rounded-md border-2 border-outline-variant focus:border-primary text-sm bg-surface outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Document Uploads */}
        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-primary text-white text-xs flex items-center justify-center">4</span>
            Document Uploads
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "ownerIdFile", label: "Owner National ID / Passport", accept: "image/*,.pdf" },
              { key: "businessLicenseFile", label: "Business License", accept: "image/*,.pdf" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wide mb-2">
                  {f.label}
                </label>
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-md cursor-pointer transition-colors ${files[f.key]
                    ? "border-green-400 bg-green-50"
                    : fieldErrors[f.key]
                      ? "border-error bg-surface-variant"
                      : "border-outline-variant bg-surface hover:border-primary hover:bg-primary/5"
                  }`}>
                  <input
                    type="file"
                    accept={f.accept}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFiles((prev) => ({ ...prev, [f.key]: file }));
                        setFieldErrors((prev) => ({ ...prev, [f.key]: "" }));
                      }
                    }}
                  />
                  {files[f.key] ? (
                    <div className="text-center px-3">
                      <p className="text-2xl mb-1 flex justify-center"><FiCheckCircle /></p>
                      <p className="text-xs font-semibold text-green-700 truncate max-w-full">
                        {files[f.key].name}
                      </p>
                      <p className="text-xs text-primary mt-0.5">
                        {(files[f.key].size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center px-3">
                      <p className="text-2xl mb-1 flex justify-center"><FiFileText /></p>
                      <p className="text-xs text-on-surface-variant">Click to upload</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">PDF or Image</p>
                    </div>
                  )}
                </label>
                {fieldErrors[f.key] && (
                  <p className="text-error text-xs mt-1">{fieldErrors[f.key]}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded-lg py-3.5 font-semibold text-sm hover:bg-primary-container transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-lg animate-spin" />
              Submitting profile...
            </>
          ) : "Submit Store Profile →"}
        </button>
      </form>
    </div>
  );
}

export default function StoreCompleteProfilePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  return (
    <div className="min-h-screen bg-surface flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#1A1A2E] to-[#2d1b3d] flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute w-96 h-96 rounded-lg bg-primary/10 -top-24 -right-24 blur-3xl" />
        <div className="relative z-10 text-center">
          <h1 className="font-display font-bold text-5xl text-white">
            read<span className="text-primary">books</span>
          </h1>
          <p className="text-white/50 mt-3 text-base max-w-xs leading-relaxed">
            Finish setting up your bookstore profile for review.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[620px] bg-white flex flex-col justify-center px-8 lg:px-12 py-12 overflow-y-auto">
        <div className="lg:hidden mb-8">
          <span className="font-display font-bold text-2xl text-on-surface">
            read<span className="text-primary">books</span>
          </span>
        </div>
        <CompleteProfileStage token={token} />
      </div>
    </div>
  );
}
