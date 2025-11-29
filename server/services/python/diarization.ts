import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export async function sendToDiarizationService(filepath: string) {
  const form = new FormData();
  form.append("file", fs.createReadStream(filepath));

  const response = await axios.post(
    "https://your-diarization-service.up.railway.app/diarize",
    form,
    {
      headers: form.getHeaders(),
      timeout: 1000 * 60 * 5 // 5 min timeout just in case
    }
  );

  return response.data;
}