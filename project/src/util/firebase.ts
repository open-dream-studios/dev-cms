import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC8gZQrptf0uQ29PJFyzYGQzVRSPM3WB2E",
  authDomain: "dev-cms-ff4d5.firebaseapp.com",
  projectId: "dev-cms-ff4d5",
  storageBucket: "dev-cms-ff4d5.firebasestorage.app",
  messagingSenderId: "59932662889",
  appId: "1:59932662889:web:ec1649123e29c84b5016f8",
  measurementId: "G-GDNHRMYZY8"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
