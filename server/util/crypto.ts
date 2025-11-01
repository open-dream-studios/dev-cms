// server/util/crypto.ts
import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.CRYPTO_SECRET || "mysecret";

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}