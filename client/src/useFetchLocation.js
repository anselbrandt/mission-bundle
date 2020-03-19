import { useEffect, useState } from 'react';
const api_key = process.env.REACT_APP_API_KEY;

export default function useFetchLocation() {
  const [location, setLocation] = useState();

  useEffect(() => {
    fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${api_key}`,
      {
        method: 'POST',
        body: JSON.stringify({ considerIp: true }),
      },
    )
      .then(response => response.json())
      .then(response => {
        setLocation(response.location);
      });
  }, []);

  return { location };
}
