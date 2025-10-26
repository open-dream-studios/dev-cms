// project/src/util/axios.ts
import axios from "axios";

export const makeRequest = axios.create({
  baseURL: "https://tsa-inventory-production.up.railway.app",
  withCredentials: true, 
});