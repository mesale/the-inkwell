import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import api from "../../api/axiosInstance";
import { unwrapList } from "../../utils/apiHelpers";
import { FiMapPin, FiPhone, FiMail, FiSearch, FiX, FiCompass, FiBookOpen } from "react-icons/fi";

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");

  // State for the currently selected store and its branches
  const [selectedStore, setSelectedStore] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get("/stores/public", { skipAuth: true })
      .then((res) => {
        setStores(unwrapList(res));
      })
      .catch((err) => {
        console.error("Failed to fetch stores", err);
        setStores([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Fetch branches whenever a store is selected
  useEffect(() => {
    if (!selectedStore) {
      setBranches([]);
      return;
    }
    setBranchesLoading(true);
    api.get(`/stores/me/branch/public/branchs/${selectedStore.id}`, { skipAuth: true })
      .then((res) => {
        setBranches(unwrapList(res));
      })
      .catch((err) => {
        console.error("Failed to fetch branches", err);
        setBranches([]);
      })
      .finally(() => {
        setBranchesLoading(false);
      });
  }, [selectedStore]);

  // Filter stores based on search query and region
  const filteredStores = stores.filter((store) => {
    const nameMatch = store.storeName?.toLowerCase().includes(searchQuery.toLowerCase());
    const cityMatch = store.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const regionMatch = store.region?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || cityMatch || regionMatch;

    const matchesRegion = selectedRegion === "All Regions" || 
      store.region?.toLowerCase() === selectedRegion.toLowerCase();

    return matchesSearch && matchesRegion;
  });

  // Get unique regions for filtering
  const regions = ["All Regions", ...new Set(stores.map((s) => s.region).filter(Boolean))];

  return (
    <div className="min-h-screen bg-background text-on-background antialiased pt-24 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="bg-primary text-on-primary py-16 px-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="max-w-7xl mx-auto w-full relative z-10 text-center md:text-left">
            <h1 className="display-md font-display mb-4 text-on-primary">Our Partner Bookstores</h1>
            <p className="body-lg text-on-primary/80 max-w-2xl">
              Explore independent bookstores, local distributors, and publishers offering curated selections of literature. Click any store card to see its active branches.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-8 py-12 w-full">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-stone">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <span className="absolute left-3.5 top-3.5 text-on-surface-variant">
                <FiSearch className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Search by store name, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white border border-outline-variant rounded-md text-sm outline-none focus:border-primary transition-colors placeholder-on-surface-variant/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3.5 text-on-surface-variant hover:text-on-surface"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Region Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
              {regions.map((reg) => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  className={`whitespace-nowrap px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 ${
                    selectedRegion === reg
                      ? "bg-primary text-on-primary"
                      : "bg-surface-variant text-on-surface-variant hover:bg-stone hover:text-on-surface"
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          {/* Stores Listing */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-elevation-1 p-6 animate-pulse flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-surface-variant" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-5 bg-surface-variant rounded w-3/4" />
                      <div className="h-4 bg-surface-variant rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="h-4 bg-surface-variant rounded w-full" />
                    <div className="h-4 bg-surface-variant rounded w-5/6" />
                    <div className="h-4 bg-surface-variant rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant text-center">
              <span className="text-5xl text-primary/40 mb-4">
                <FiCompass />
              </span>
              <h3 className="headline-sm text-on-surface font-semibold">No Bookstores Found</h3>
              <p className="body-md mt-1 text-on-surface-variant max-w-sm">
                We couldn't find any bookstores matching your search query or selected filters.
              </p>
              {(searchQuery || selectedRegion !== "All Regions") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedRegion("All Regions");
                  }}
                  className="mt-6 px-5 py-2 border-2 border-primary text-primary hover:bg-primary hover:text-on-primary font-semibold text-sm rounded-lg transition-all duration-300"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store) => {
                // Generate a consistent placeholder logo background & initials
                const initials = store.storeName ? store.storeName.substring(0, 2).toUpperCase() : "ST";
                // Premium dynamic placeholder logo icon
                const placeholderLogoUrl = `https://placehold.co/120x120/041627/ffffff?text=${encodeURIComponent(initials)}`;

                return (
                  <div
                    key={store.id}
                    onClick={() => setSelectedStore(store)}
                    className="bg-white border border-outline-variant/40 rounded-lg p-6 shadow-elevation-1 hover:shadow-elevation-3 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {/* Store Header Info */}
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={placeholderLogoUrl}
                          alt={store.storeName}
                          className="w-16 h-16 object-cover rounded-lg shadow-elevation-1 border border-outline-variant/20 flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/120x120/041627/ffffff?text=ST";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="headline-sm text-primary font-bold truncate group-hover:text-primary-container transition-colors" title={store.storeName}>
                            {store.storeName}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary mt-1">
                            <FiBookOpen className="w-3.5 h-3.5" /> Partner Store
                          </span>
                        </div>
                      </div>

                      {/* Store Details Grid */}
                      <div className="space-y-2.5 my-4 pt-4 border-t border-stone/50 text-sm">
                        {/* Address */}
                        <div className="flex items-start gap-2.5 text-on-surface-variant">
                          <FiMapPin className="w-4 h-4 mt-0.5 text-primary/70 flex-shrink-0" />
                          <span className="line-clamp-2">
                            {store.address ? `${store.address}, ` : ""}
                            {store.city ? `${store.city}, ` : ""}
                            {store.region || ""}
                          </span>
                        </div>

                        {/* Email */}
                        {store.email && (
                          <div className="flex items-center gap-2.5 text-on-surface-variant">
                            <FiMail className="w-4 h-4 text-primary/70 flex-shrink-0" />
                            <span className="truncate">{store.email}</span>
                          </div>
                        )}

                        {/* Phone */}
                        {store.phone && (
                          <div className="flex items-center gap-2.5 text-on-surface-variant">
                            <FiPhone className="w-4 h-4 text-primary/70 flex-shrink-0" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Visual CTA */}
                    <div className="mt-4 pt-3 border-t border-stone/20 text-right">
                      <span className="text-xs font-bold text-primary group-hover:underline inline-flex items-center gap-1">
                        View Branches & Details &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Branches Modal Detail Overlay */}
      {selectedStore && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setSelectedStore(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-elevation-3 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col transform transition-transform duration-300 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-stone flex items-center justify-between bg-primary text-on-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center font-display font-bold text-lg text-on-primary">
                  {selectedStore.storeName ? selectedStore.storeName.substring(0, 2).toUpperCase() : "ST"}
                </div>
                <div>
                  <h2 className="headline-sm font-bold text-on-primary line-clamp-1">{selectedStore.storeName}</h2>
                  <p className="caption text-on-primary/70">Store details & active branches</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStore(null)}
                className="p-1 rounded-full hover:bg-white/10 text-on-primary/80 hover:text-on-primary transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Store Info Summary Card */}
              <div className="bg-surface border border-outline-variant/30 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">Main Address</h4>
                  <div className="flex items-start gap-1.5 text-on-surface">
                    <FiMapPin className="w-4 h-4 mt-0.5 text-primary/70 flex-shrink-0" />
                    <span>
                      {selectedStore.address ? `${selectedStore.address}, ` : ""}
                      {selectedStore.city ? `${selectedStore.city}, ` : ""}
                      {selectedStore.region || ""}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedStore.email && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-0.5">Email</h4>
                      <div className="flex items-center gap-1.5 text-on-surface">
                        <FiMail className="w-4 h-4 text-primary/70 flex-shrink-0" />
                        <span>{selectedStore.email}</span>
                      </div>
                    </div>
                  )}
                  {selectedStore.phone && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-0.5">Phone</h4>
                      <div className="flex items-center gap-1.5 text-on-surface">
                        <FiPhone className="w-4 h-4 text-primary/70 flex-shrink-0" />
                        <span>{selectedStore.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Branches section */}
              <div>
                <h3 className="headline-sm text-primary font-bold mb-3 border-b border-stone pb-2 flex items-center gap-2">
                  <FiCompass className="w-5 h-5 text-primary/80" /> Active Branches ({branches.length})
                </h3>

                {branchesLoading ? (
                  <div className="space-y-3 py-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="border border-outline-variant/30 rounded-lg p-4 animate-pulse flex flex-col gap-2 bg-white">
                        <div className="h-4 bg-surface-variant rounded w-1/3" />
                        <div className="h-3 bg-surface-variant rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : branches.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant bg-surface rounded-lg border border-dashed border-outline-variant">
                    <p className="body-md font-medium">No registered branches found.</p>
                    <p className="caption mt-1">This bookstore does not have any physical branches registered at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {branches.map((branch) => (
                      <div 
                        key={branch.id} 
                        className="border border-outline-variant/30 hover:border-primary/40 rounded-lg p-4 bg-white transition-all duration-300 shadow-elevation-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-primary text-base">{branch.branchName}</h4>
                          <div className="flex items-start gap-1.5 text-xs text-on-surface-variant">
                            <FiMapPin className="w-3.5 h-3.5 mt-0.5 text-primary/70 flex-shrink-0" />
                            <span>
                              {branch.address ? `${branch.address}, ` : ""}
                              {branch.city ? `${branch.city}, ` : ""}
                              {branch.region || ""}
                            </span>
                          </div>
                          {branch.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                              <FiPhone className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                              <span>{branch.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface border-t border-stone flex justify-end">
              <button 
                onClick={() => setSelectedStore(null)}
                className="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-semibold text-sm rounded-lg transition-colors shadow-elevation-1"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
