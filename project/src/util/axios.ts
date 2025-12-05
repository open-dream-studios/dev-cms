// project/src/util/axios.ts
import axios from "axios";
const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_BACKEND === "true";

export const makeRequest = axios.create({
  baseURL: useLocal ? process.env.NEXT_PUBLIC_BACKEND_URL : "",
  withCredentials: true,
});
