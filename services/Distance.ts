const GOOGLE_MAPS_API_KEY = "AIzaSyCy9vw9wy_eZeYd4BO9ifFiky2vOfvB-zc";
const OPENROUTESERVICE_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImY3MDRkYTQ3MWYxNDRiMTdiODBiMGViNzQwZTZiY2NjIiwiaCI6Im11cm11cjY0In0=";

export async function getGoogleDrivingDistance({ start, end }: { start: Location; end: Location; }): Promise<number> {
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${start.latitude},${start.longitude}&destinations=${end.latitude},${end.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (
      data.rows &&
      data.rows[0] &&
      data.rows[0].elements &&
      data.rows[0].elements[0] &&
      data.rows[0].elements[0].distance
    ) {
      // Convert meters to kilometers
      return data.rows[0].elements[0].distance.value / 1000;
    }

    return 0;
  } catch (error) {
    console.error("Google Driving Distance error:", error);
    return 0;
  }
}

 export async function getORSDrivingDistance(start: Location, end: Location): Promise<number> {
    try {
      const url = "https://api.openrouteservice.org/v2/matrix/driving-car";
      const body = JSON.stringify({
        locations: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude]
        ],
        metrics: ["distance"]
      });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": OPENROUTESERVICE_API_KEY,
          "Content-Type": "application/json",
        },
        body,
      });
      const data = await response.json();
      if (data.distances && data.distances[0] && data.distances[0][1]) {
        return data.distances[0][1] / 1000; // meters to km
      }
      return 0;
    } catch (error) {
      console.error("ORS Driving Distance error:", error);
      return 0;
    }
  }