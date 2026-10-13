import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import keycloak from "../auth/keycloak";
import { AuthContext } from "./authContext";
import { getDashboardPath } from "./authUtils";

let keycloakInitPromise;

function initKeycloak() {
  if (!keycloakInitPromise) {
    keycloakInitPromise = keycloak
      .init({
        onLoad: "check-sso",
        // Use a hidden iframe to check the SSO session instead of a top-level
        // redirect. Without this, `check-sso` navigates the whole browser to
        // Keycloak, so if Keycloak is down/unreachable the app (incl. the public
        // homepage) never renders. With the silent iframe, an unreachable
        // Keycloak simply resolves as "not authenticated" and the app loads.
        silentCheckSsoRedirectUri:
          window.location.origin + "/silent-check-sso.html",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      // Never let a Keycloak outage block the SPA from rendering.
      .catch((error) => {
        console.error("Keycloak init failed; continuing unauthenticated", error);
        return false;
      });
  }

  return keycloakInitPromise;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef(null);
  const hasRedirectedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect ONLY ONCE after initial login, then allow free navigation
    if (!loading && user && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const targetPath = getDashboardPath(user.roles);
      if (location.pathname === "/" || location.pathname === "/login") {
        navigate(targetPath);
      }
    }
  }, [location.pathname, navigate, user, loading]);

  useEffect(() => {
    let mounted = true;

    initKeycloak()
      .then((authenticated) => {
        if (!mounted) return;

        if (authenticated) {
          const profile = keycloak.tokenParsed;

          const roles = profile?.realm_access?.roles || [];

          const userData = {
            id: profile.sub,
            name: profile.name || profile.preferred_username,
            email: profile.email,
            roles,
          };

          setUser(userData);
          setToken(keycloak.token);
          localStorage.setItem("token", keycloak.token);

          // prevent multiple intervals
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
          }

          refreshIntervalRef.current = setInterval(() => {
            keycloak.updateToken(60).then((refreshed) => {
              if (refreshed) {
                setToken(keycloak.token);
                localStorage.setItem("token", keycloak.token);
              }
            });
          }, 30000);
        } else {
          // IMPORTANT: clear user explicitly
          setUser(null);
          setToken(null);
          localStorage.removeItem("token");
        }
      })
      .catch((error) => {
        console.error("Keycloak initialization failed", error);

        if (mounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("token");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const login = useCallback(async () => {
    try {
      await initKeycloak();
      await keycloak.login({ redirectUri: window.location.href });
    } catch (error) {
      console.error("Keycloak login failed", error);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  const hasRole = useCallback((role) => user?.roles?.includes(role), [user]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

