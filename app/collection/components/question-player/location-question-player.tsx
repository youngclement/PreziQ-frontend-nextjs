"use client";

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { FlagTriangleRight, MapPin, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// Set your Mapbox access token
mapboxgl.accessToken = "pk.eyJ1IjoiY2NkY2MxMSIsImEiOiJjbWFnbXduZDkwMmV6MnFzbDIxM3dxMTJ4In0.2-eYJyMMthGbAa9SOtCDbQ";

interface LocationQuestionPlayerProps {
  questionText: string;
  locationData: {
    lat: number;
    lng: number;
    radius: number;
    hint?: string;
  };
  onAnswer: (isCorrect: boolean, distance: number) => void;
  mapStyle?: string;
  use3D?: boolean;
  useGlobe?: boolean;
}

export function LocationQuestionPlayer({
  questionText,
  locationData,
  onAnswer,
  mapStyle = "mapbox://styles/mapbox/streets-v12",
  use3D = false,
  useGlobe = false
}: LocationQuestionPlayerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const correctLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [distance, setDistance] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);

  // Check if we're in a browser environment
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Add styling for globe mode
  useEffect(() => {
    if (!isBrowser) return;

    const style = document.createElement('style');
    style.innerHTML = `
      .mapboxgl-canvas {
        filter: drop-shadow(0px 0px 15px rgba(0, 60, 255, 0.3));
      }
      
      .globe-mode .mapboxgl-canvas-container {
        background: radial-gradient(circle, #0f2027, #203a43, #2c5364);
      }
      
      .custom-marker {
        width: 24px;
        height: 24px;
        background-color: #ff0000;
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [isBrowser]);

  useEffect(() => {
    if (!isBrowser || !mapContainerRef.current) return;

    // Mark container when using globe mode
    if (useGlobe && mapContainerRef.current) {
      mapContainerRef.current.classList.add('globe-mode');
    }

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [0, 20], // Start with world view
        zoom: 1.5,
        pitch: use3D ? 45 : 0,
        bearing: use3D ? 15 : 0,
        projection: useGlobe ? 'globe' : 'mercator',
        antialias: true,
      });

      mapRef.current = map;

      // Add atmosphere and sky effects if 3D mode is active
      map.on('style.load', () => {
        if (use3D) {
          try {
            // Add atmosphere
            map.setFog({
              'color': 'rgb(186, 210, 235)',
              'high-color': 'rgb(36, 92, 223)',
              'horizon-blend': 0.1,
              'space-color': 'rgb(11, 11, 25)',
              'star-intensity': 0.6
            });

            // Add sky effect
            map.addLayer({
              'id': 'sky',
              'type': 'sky',
              'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 90.0],
                'sky-atmosphere-sun-intensity': 15
              }
            });
          } catch (error) {
            console.error("Error adding 3D effects:", error);
          }
        }
      });

      map.on("load", () => {
        setMapLoaded(true);

        try {
          // Add a marker that will be placed when user clicks
          const marker = new mapboxgl.Marker({
            color: "#FF0000",
            draggable: true
          });

          markerRef.current = marker;

          // Add click handler to place marker
          map.on("click", (e) => {
            if (hasAnswered) return; // Prevent changes after answering

            const { lng, lat } = e.lngLat;
            marker.setLngLat([lng, lat]).addTo(map);
            setSelectedLocation({ lat, lng });
          });
        } catch (error) {
          console.error("Error setting up map click handling:", error);
        }
      });

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
      return () => { };
    }
  }, [mapStyle, use3D, useGlobe, hasAnswered, isBrowser]);

  // Function to calculate distance between two points in km
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  // Function to submit answer
  const handleSubmitAnswer = () => {
    if (!selectedLocation || !mapRef.current) return;

    try {
      // Calculate distance between selected location and correct location
      const calculatedDistance = calculateDistance(
        selectedLocation.lat,
        selectedLocation.lng,
        locationData.lat,
        locationData.lng
      );

      setDistance(calculatedDistance);

      // Check if answer is within acceptable radius
      const answerIsCorrect = calculatedDistance <= locationData.radius;
      setIsCorrect(answerIsCorrect);
      setHasAnswered(true);

      // Show the correct location with a green marker
      correctLocationMarkerRef.current = new mapboxgl.Marker({ color: "#00FF00" })
        .setLngLat([locationData.lng, locationData.lat])
        .addTo(mapRef.current);

      // Draw a line between the two points
      if (mapRef.current.getSource('route')) {
        (mapRef.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [selectedLocation.lng, selectedLocation.lat],
              [locationData.lng, locationData.lat]
            ]
          }
        });
      } else {
        mapRef.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [selectedLocation.lng, selectedLocation.lat],
                [locationData.lng, locationData.lat]
              ]
            }
          }
        });

        mapRef.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#888',
            'line-width': 2
          }
        });
      }

      // Adjust the map to show both points
      const bounds = new mapboxgl.LngLatBounds()
        .extend([selectedLocation.lng, selectedLocation.lat])
        .extend([locationData.lng, locationData.lat]);

      mapRef.current.fitBounds(bounds, {
        padding: 80
      });

      // Call the onAnswer callback
      onAnswer(answerIsCorrect, calculatedDistance);
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-medium text-center mb-2">
          {questionText || "Chọn vị trí trên bản đồ"}
        </h3>

        {/* Hint section */}
        {locationData.hint && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 flex items-start">
            <Button
              variant="ghost"
              size="sm"
              className="text-yellow-600 dark:text-yellow-400 p-0 h-auto mr-2"
              onClick={() => setShowHint(!showHint)}
            >
              <FlagTriangleRight className="h-5 w-5" />
            </Button>
            <div>
              <p className="font-medium text-sm text-yellow-800 dark:text-yellow-400">
                {showHint ? locationData.hint : "Gợi ý (Nhấn để xem)"}
              </p>
            </div>
          </div>
        )}

        {/* Map container */}
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg"
          />
        </div>

        {/* Selected coordinates display */}
        {selectedLocation && !hasAnswered && (
          <div className="bg-muted/30 p-3 rounded-md text-sm text-center">
            <p>Vị trí đã chọn: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
            <p className="text-muted-foreground text-xs mt-1">
              Kéo ghim đỏ để điều chỉnh vị trí chính xác hơn
            </p>
          </div>
        )}

        {/* Result display */}
        {hasAnswered && (
          <div className={`p-4 rounded-md ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center">
              {isCorrect ? (
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              ) : (
                <X className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              )}
              <h4 className="font-medium">
                {isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
              </h4>
            </div>
            <p className="mt-1 text-sm">
              Bạn đã chọn cách vị trí đúng {distance.toFixed(1)} km.
              {isCorrect
                ? ' Trong phạm vi cho phép!'
                : ` (Vượt quá phạm vi cho phép ${locationData.radius} km)`}
            </p>
          </div>
        )}

        {/* Submit button */}
        {selectedLocation && !hasAnswered && (
          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
            onClick={handleSubmitAnswer}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Gửi câu trả lời
          </Button>
        )}

        {hasAnswered && (
          <div className="text-sm text-center text-muted-foreground">
            Vị trí chính xác: {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}