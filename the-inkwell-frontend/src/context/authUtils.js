export const getDashboardPath = (roles) => {
  if (roles.includes("ROLE_ADMIN")) return "/admin";
  if (roles.includes("ROLE_STORE_ADMIN")) return "/store";
  if (roles.includes("ROLE_WORKER") || roles.includes("ROLE_EMPLOYEE")) return "/employee";
  if (roles.includes("ROLE_USER")) return "/dashboard";
  return "/";
};
