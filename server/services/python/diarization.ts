import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export async function sendToDiarizationService(filepath: string) {
  const form = new FormData();
  form.append("file", fs.createReadStream(filepath));
  console.log("sending...\n")
  const response = await axios.post(
    "https://dev-cms-server-py-production.up.railway.app/diarize",
    form,
    {
      headers: form.getHeaders(),
      timeout: 1000 * 60 * 5 // 5 min timeout just in case
    }
  );
  console.log(response.data)
  return response.data;
}

sendToDiarizationService("./test2.mp3")