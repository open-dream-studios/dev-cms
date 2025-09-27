// server/util/helpers/twilio/twilio.js
// ITU G.711 µ-law decoder → signed PCM16
export function mulawDecode(muLawByte) {
  muLawByte = ~muLawByte & 0xff;
  const sign = muLawByte & 0x80 ? -1 : 1;
  const exponent = (muLawByte >> 4) & 0x07;
  const mantissa = muLawByte & 0x0f;
  const sample = ((mantissa << 1) + 1) << (exponent + 2);
  return sign * sample;
}

export function decodeMuLawBuffer(muLawBuffer) {
  const pcmBuffer = Buffer.alloc(muLawBuffer.length * 2);
  // for (let i = 0; i < muLawBuffer.length; i++) {
  //   const decoded = mulawDecode(muLawBuffer[i]);
  //   pcmBuffer.writeInt16LE(decoded, i * 2);
  // }
  for (let i = 0; i < muLawBuffer.length; i++) {
    const decoded = mulawDecode(muLawBuffer[i]);
    const scaled = Math.max(-32768, Math.min(32767, decoded * 0.25)); // reduce gain
    pcmBuffer.writeInt16LE(scaled, i * 2);
  }
  return pcmBuffer;
}

async function flushStreamBuffer(sid) {
  const s = callBuffers[sid];
  if (!s || !s.chunks.length) return;

  const pcmData = Buffer.concat(s.chunks);
  s.chunks = [];
  s.mediaCount = 0;
  s.firstTimestamp = null;
  s.firstWallclock = Date.now();

  // Skip tiny segments
  if (pcmData.length < 3200) {
    console.log("⚠️ Skipping tiny audio segment");
    return;
  }

  const recordingsDir = path.join(__dirname, "../recordings");
  fs.mkdirSync(recordingsDir, { recursive: true });

  const filePath = path.join(
    recordingsDir,
    `${sid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.wav`
  );
  console.log("🎙️ Saving wav to:", filePath);

  const writer = new wav.FileWriter(filePath, {
    sampleRate: 8000,
    channels: 1,
    bitDepth: 16,
  });

  writer.write(pcmData);
  writer.end();

  writer.on("finish", async () => {
    try {
      const { track } = callBuffers[sid] || {};
      const speakerLabel = track === "inbound" ? "[Caller]" : "[Callee]";

      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
      });

      console.log(`${speakerLabel} ${response.text}`);
    } catch (err) {
      console.error(
        "❌ Transcription error:",
        err.response?.data || err.message
      );
    } finally {
      fs.unlink(filePath, () => {});
    }
  });
}