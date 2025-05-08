"use client";

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { FlagTriangleRight, MapPin, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// Set your Mapbox access token
mapboxgl.accessToken = "pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNrbDRtNWNmMjEyOGUycG55anp0aHEwYjAifQ.9Rk4PxZEqEnbBTgLfP-0kA";

interface LocationQuestionPlayerProps {
  questionText: string;
  locationData: {
    lat: number;
    lng: number;
    radius: number;
    hint?: string;
  };
  onAnswer: (isCorrect: boolean, distance: number) => void;
}

export function LocationQuestionPlayer({
  questionText,
  locationData,
  onAnswer
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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 20], // Start with world view
      zoom: 1.5,
    });

    mapRef.current = map;

    map.on("load", () => {
      setMapLoaded(true);

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
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Function to calculate distance between two points in km
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  }
  
  function deg2rad(deg: number) {
    return deg * (Math.PI/180);
  }

  // Function to submit answer
  const handleSubmitAnswer = () => {
    if (!selectedLocation || !mapRef.current) return;

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