import api from "./axiosInstance";

export const registerUser = (data) => api.post("/users/register", data);
export const getMyProfile = () => api.get("/users/me");
export const updateProfile = (data) => api.put("/users/me", data);
export const getMyOrders = () => api.get("/orders");
