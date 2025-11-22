// server/handlers/modules/calls/aircall/aircall_api.ts
import axios from "axios";

const AIRCALL_API_ID = process.env.AIR_CALL_API_ID!;
const AIRCALL_API_TOKEN = process.env.AIR_CALL_API_TOKEN!;

const api = axios.create({
  baseURL: "https://api.aircall.io/v1",
  auth: {
    username: AIRCALL_API_ID,
    password: AIRCALL_API_TOKEN,
  },
});

/** Get full call details (including recording link) */
export async function getCallDetails(callId: number) {
  const res = await api.get(`/calls/${callId}`);
  return res.data;
}

export async function downloadRecordingFile(url: string) {
  return axios.get(url, {
    responseType: "arraybuffer",
    validateStatus: () => true,
  }).then(res => {
    if (res.status !== 200) {
      throw new Error(`S3 Download failed: ${res.status}`);
    }
    return res.data;
  });
}