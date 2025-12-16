import axios from "axios";
import { auth, provider, signInWithPopup } from "./firebase"; 
import { toast } from "react-toastify";
import { makeRequest } from "./axios";

export type LoginInputs = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
};

export type RegisterInputs = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export const login = async (inputs: LoginInputs) => {
  try {
    const res = await axios.post("/api/auth/login", inputs, {
      withCredentials: true,
    });
    const success = res.status === 200;
    if (!success) {
      toast.error(res.data.message);
    }
    return success;
  } catch (err) {
    toast.error("Login failed");
    console.error("Login failed", err);
    return false;
  }
};

export const logout = async () => {
  try {
    const res = await makeRequest.post("/api/auth/logout");
    return res.status === 200;
  } catch (err) {
    console.error("Login failed", err);
    return false;
  }
};

export const register = async (inputs: RegisterInputs) => {
  try {
    const res = await axios.post("/api/auth/register", inputs, {
      withCredentials: true,
    });
    const success = res.status === 200;
    if (!success) {
      toast.error(res.data.message);
    }
    return success;
  } catch (err) {
    toast.error("Registration failed");
    console.error("Registration failed", err);
    return false;
  }
};

export const googleSignIn = async () => {
  try {
    const googleAccount = await signInWithPopup(
      auth,
      provider.setCustomParameters({ prompt: "select_account" })
    );

    const user = googleAccount.user;
    const idToken = await user.getIdToken();

    const res = await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL + "/api/auth/google",
      { idToken },
      {
        withCredentials: true,
      }
    );
    const success = res.status === 200;
    if (!success) {
      toast.error(res.data.message);
    }
    return success;
  } catch (error) {
    toast.error("Google auth failed");
    console.error("Google auth failed:", error);
    return false;
  }
};
