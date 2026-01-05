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
    const params = new URLSearchParams(window.location.search);
    const invite_token = params.get("token");

    const res = await makeRequest.post("/auth/login", {
      ...inputs,
      invite_token,
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
    const res = await makeRequest.post("/auth/logout");
    return res.status === 200;
  } catch (err) {
    console.error("Login failed", err);
    return false;
  }
};

export const register = async (router: any, inputs: RegisterInputs) => {
  try {
    const params = new URLSearchParams(window.location.search);
    const invite_token = params.get("token");

    const res = await makeRequest.post("/auth/register", {
      ...inputs,
      invite_token,
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
    const params = new URLSearchParams(window.location.search);
    const invite_token = params.get("token");

    const googleAccount = await signInWithPopup(
      auth,
      provider.setCustomParameters({ prompt: "select_account" })
    );

    const user = googleAccount.user;
    const idToken = await user.getIdToken();

    const res = await makeRequest.post("/auth/google", {
      idToken,
      invite_token,
    });

    const success = res.status === 200;
    if (!success) {
      toast.error(res.data.message);
    }
    return success;
  } catch (error: any) {
    if (error.status === 402) {
      toast.error("User already exists with another sign in method");
      return false;
    } else if (
      error?.code === "auth/popup-closed-by-user" ||
      error?.code === "auth/cancelled-popup-request"
    ) {
      return false;
    } else {
      toast.error("Google auth failed");
      console.error("Google auth failed:", error);
      return false;
    }
  }
};
