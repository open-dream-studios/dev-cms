// project/src/util/axios.ts
import axios from "axios";

console.log("FINAL BACKEND URL USED:", process.env.NEXT_PUBLIC_BACKEND_URL);

export const makeRequest = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});
