// server/services/google/googleMaps.js
export const autoCompleteAddress = async (
  GOOGLE_API_KEY,
  address,
  sessiontoken
) => {
  if (!address || !sessiontoken) {
    throw new Error("Missing address or sessiontoken");
  }
  const priorityLat = 43.1566;
  const priorityLng = -77.6088;
  const radius = 200000; // 200 km radius (adjust if needed)
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    address
  )}&key=${GOOGLE_API_KEY}&sessiontoken=${sessiontoken}&components=country:us&location=${priorityLat},${priorityLng}&radius=${radius}`;
  const googleRes = await fetch(url);
  return await googleRes.json();
};

export const addressDetails = async (
  GOOGLE_API_KEY,
  place_id,
  sessiontoken
) => {
  if (!place_id || !sessiontoken) {
    throw new Error("Missing place_id or sessiontoken");
  }
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_API_KEY}&sessiontoken=${sessiontoken}`;
  const googleRes = await fetch(url);
  return await googleRes.json();
};
