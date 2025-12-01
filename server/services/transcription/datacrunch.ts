import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const API_KEY = process.env.DATACRUNCH_API_KEY;
if (!API_KEY) throw new Error("Missing DATACRUNCH_API_KEY in .env");

const test = () => {
  const url = "https://inference.datacrunch.io/whisper/predict";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };
  const data = {
    audio_input:
      "http://ia800205.us.archive.org/19/items/Winston_Churchill/1940-06-04_BBC_Winston_Churchill_We_Shall_Never_Surrender.mp3",
  };

  axios
    .post(url, data, { headers: headers })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};
test()

// async function transcribeWithWhisperX() {
//   console.log("Uploading to Datacrunch WhisperX...");

//   const response = await axios.post(
//     "https://inference.datacrunch.io/whisper/predict",
//     {
//       audio_input:
//         "https://tsa-cms-data.s3.us-east-2.amazonaws.com/prod/PROJ-90959de1e1d/recordings/10567485-5fda-48d2-9c20-bd54dc83051e.mp3",
//       processing_type: "diarize",
//       language: "en",
//     },
//     {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${API_KEY}`,
//       },
//       timeout: 1000 * 60 * 10,
//     }
//   );
//   console.log(response.data);

//   return response.data;
// }

// async function run() {
//   try {
//     const result = await transcribeWithWhisperX();
//     console.log("\n--- WhisperX Result ---");
//     console.log(JSON.stringify(result, null, 2));
//   } catch (err: any) {
//     console.error(err.response?.data || err.message);
//   }
// }

// run();

