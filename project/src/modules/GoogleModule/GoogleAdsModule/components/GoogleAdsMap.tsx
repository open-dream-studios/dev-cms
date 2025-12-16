import React, { useContext, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";
import { AuthContext } from "@/contexts/authContext";
import SmoothSkeleton from "@/lib/skeletons/SmoothSkeleton";
import { useGoogleUIStore } from "../../_googleStore";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";

const GoogleAdsMap = () => {
  const { isLoadingGoogleAdsData } = useGoogleUIStore();
  if (isLoadingGoogleAdsData) {
    return <SmoothSkeleton />;
  }

  return (
    <div className="h-[100%]">
      <GoogleAdsMapView />
    </div>
  );
};

const GoogleAdsMapView: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const bounds: mapboxgl.LngLatBoundsLike = [
    [-144, 2],
    [-34, 57],
  ];

  const exampleGeocode = {
    geoId: 99914604,
    zip: "14604",
    center: [-77.6047, 43.1566],
  };

  useEffect(() => {
    if (!mapContainerRef.current || !currentUser) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style:
        currentUser.theme === "light"
          ? "mapbox://styles/infinityslide01/cmi5u3lga00kg01s46p9ebqfd"
          : "mapbox://styles/infinityslide01/cmi5u22xf00a801ryc5dihwff",
      center: [-95.7, 33.3283],
      maxBounds: bounds,
      zoom: 2,
      attributionControl: false,
      interactive: true,
      projection: "mercator",
    });

    mapRef.current = map;

    map.on("load", () => {
      const { geoId, center } = exampleGeocode;
      const [lng, lat] = center;

      // create a circle polygon around the center (5 miles radius)
      const radiusMiles = 50;
      const circleGeoJSON = turf.circle([lng, lat], radiusMiles, {
        units: "miles",
        steps: 64,
      });

      const sourceId = `geo-${geoId}-circle`;
      const fillLayerId = `${sourceId}-fill`;
      const outlineLayerId = `${sourceId}-outline`;

      // If source exists (hot reload), update it; otherwise add
      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(
          circleGeoJSON as any
        );
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: circleGeoJSON,
        });

        map.addLayer({
          id: fillLayerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.25,
          },
        });

        map.addLayer({
          id: outlineLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#6993FF",
            "line-width": 1.5,
          },
        });
      }

      // Optionally add a marker at the center
      // new mapboxgl.Marker({ color: "#1f6feb" }).setLngLat([lng, lat]).addTo(map);

      // Fit bounds to the circle for a nice zoom
      const circleBbox = turf.bbox(circleGeoJSON); // [minX, minY, maxX, maxY]
      map.fitBounds(
        [
          [circleBbox[0], circleBbox[1]],
          [circleBbox[2], circleBbox[3]],
        ],
        { padding: 40, maxZoom: 12, duration: 800 }
      );
    });

    return () => {
      // cleanup layers & sources if they exist
      if (!mapRef.current) return;
      const sourceId = `geo-1234567-circle`;
      const fillLayerId = `${sourceId}-fill`;
      const outlineLayerId = `${sourceId}-outline`;

      if (mapRef.current.getLayer(fillLayerId))
        mapRef.current.removeLayer(fillLayerId);
      if (mapRef.current.getLayer(outlineLayerId))
        mapRef.current.removeLayer(outlineLayerId);
      if (mapRef.current.getSource(sourceId))
        mapRef.current.removeSource(sourceId);

      mapRef.current.remove();
    };
  }, [currentUser?.theme]);

  if (!currentUser) return null;

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "calc(100% + 28px)",
        borderRadius: "12px",
        // overflow: "hidden",
      }}
    />
  );
};

export default GoogleAdsMap;
