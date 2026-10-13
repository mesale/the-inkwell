import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  // Defaults target a local Keycloak. Override via .env for other environments.
  // NOTE: this URL must match the backend's KEYCLOAK_ISSUER_URI host, otherwise
  // the `iss` claim on issued tokens won't match and JWT validation will fail.
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "bookstore-realm",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "bookstore-frontend",
});

export default keycloak;