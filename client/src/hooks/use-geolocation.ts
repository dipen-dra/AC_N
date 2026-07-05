import { useState } from "react";
import { toast } from "sonner";

interface LocationResult {
  address: string;
  city?: string;
  lat: number;
  lon: number;
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async (): Promise<LocationResult | null> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const msg = "Geolocation is not supported by your browser.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          try {
            // Use Nominatim OpenStreetMap API for reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            );
            const data = await response.json();

            if (data && data.display_name) {
              const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
              const result = {
                address: data.display_name,
                city,
                lat,
                lon,
              };
              resolve(result);
            } else {
              throw new Error("Unable to reverse geocode coordinates");
            }
          } catch (err) {
            console.error("Geocoding error:", err);
            const msg = "Could not fetch address from coordinates.";
            setError(msg);
            toast.error(msg);
            resolve({ address: `${lat}, ${lon}`, lat, lon }); // Fallback to raw coords
          } finally {
            setLoading(false);
          }
        },
        (geoError) => {
          let msg = "Unable to retrieve your location.";
          if (geoError.code === geoError.PERMISSION_DENIED) {
            msg = "Location permission denied. Please enable it in your browser settings.";
          }
          setError(msg);
          toast.error(msg);
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  return { loading, error, fetchLocation };
}
