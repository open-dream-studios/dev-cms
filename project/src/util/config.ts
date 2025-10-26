const local_server = true;
export const BACKEND_URL = local_server ? "http://localhost:8080" : "https://dev-cms-production.up.railway.app.app";
export const FRONTEND_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://tannyspaacquisitions.shop"