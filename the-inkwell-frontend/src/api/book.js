import api from "./axiosInstance";

export const getAllBooks = () => api.get("/books");
export const getBookById = (id) => api.get(`/books/${id}`);
export const getBranchBooks = (branchId) => api.get(`/branches/${branchId}/books`);
export const addBook = (data) => api.post("/books", data);
export const updateBook = (id, data) => api.put(`/books/${id}`, data);
export const deleteBook = (id) => api.delete(`/books/${id}`);