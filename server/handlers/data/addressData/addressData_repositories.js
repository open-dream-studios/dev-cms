// server/handlers/data/addressData/addressData_repositories.js

export const autoCompleteAddress = async (req, res) => {
  const { address, sessiontoken } = req.body;

  if (!address || !sessiontoken) {
    return res.status(400).json({ error: "Missing address or sessiontoken" });
  }

  // Priority location: Rochester, NY
  const priorityLat = 43.1566;
  const priorityLng = -77.6088;
  const radius = 200000; // 200 km radius (adjust if needed)

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    address
  )}&key=${
    process.env.GOOGLE_API_KEY
  }&sessiontoken=${sessiontoken}&components=country:us&location=${priorityLat},${priorityLng}&radius=${radius}`;

  try {
    const googleRes = await fetch(url);
    const data = await googleRes.json();
    res.json(data);
  } catch (err) {
    console.error("Autocomplete error:", err);
    res.status(500).json({ error: "Autocomplete failed" });
  }
};

export const addressDetails = async (req, res) => {
  const { place_id, sessiontoken } = req.body;

  if (!place_id || !sessiontoken) {
    return res.status(400).json({ error: "Missing place_id or sessiontoken" });
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${process.env.GOOGLE_API_KEY}&sessiontoken=${sessiontoken}`;

  try {
    const googleRes = await fetch(url);
    const data = await googleRes.json();
    res.json(data);
  } catch (err) {
    console.error("Details error:", err);
    res.status(500).json({ error: "Place details failed" });
  }
};
