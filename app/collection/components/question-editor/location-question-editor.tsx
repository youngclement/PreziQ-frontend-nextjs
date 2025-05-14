"use client";

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Maximize } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Feature, Polygon } from 'geojson';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Add a more specific type definition to the beginning of the file
declare global {
  interface Window {
    lastLocationUpdate?: {
      timestamp: number;
      activityId: string;
      locationData: any[];
      source?: string;
    };
    locationUpdateTimer?: ReturnType<typeof setTimeout>;
  }
}

// Set your Mapbox access token
mapboxgl.accessToken = "pk.eyJ1IjoiY2NkY2MxMSIsImEiOiJjbWFnbXduZDkwMmV6MnFzbDIxM3dxMTJ4In0.2-eYJyMMthGbAa9SOtCDbQ";

// Define default map style (streetline 2D)
const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

// Interface for location answers
interface LocationAnswer {
  quizLocationAnswerId?: string;
  longitude: number;
  latitude: number;
  radius: number;
  hint?: string;
}

interface LocationQuestionEditorProps {
  questionText: string;
  locationAnswers?: LocationAnswer[];
  onLocationChange: (questionIndex: number, locationData: LocationAnswer[]) => void;
  questionIndex: number;
  readonly?: boolean;
}

export function LocationQuestionEditor({
  questionText,
  locationAnswers = [], // Default to empty array
  onLocationChange,
  questionIndex,
  readonly = false,
}: LocationQuestionEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const circlesRef = useRef<Map<number, mapboxgl.GeoJSONSource>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationDataRef = useRef<string>(JSON.stringify(locationAnswers));
  const currentLocationAnswersRef = useRef<LocationAnswer[]>(locationAnswers);
  const [locationData, setLocationData] = useState<LocationAnswer[]>(locationAnswers);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number>(-1);
  const [draggedMarkerIndex, setDraggedMarkerIndex] = useState<number>(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [skipNextRefresh, setSkipNextRefresh] = useState(false);
  const previousAnswersRef = useRef<LocationAnswer[]>(locationAnswers);
  const ignoreNextUpdateRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Track previous answers to compare for selective updates
  useEffect(() => {
    // Skip updates if we're dragging or if we explicitly want to skip
    if (isDragging || skipNextRefresh || ignoreNextUpdateRef.current) {
      if (skipNextRefresh) {
        setSkipNextRefresh(false);
      }

      if (ignoreNextUpdateRef.current) {
        ignoreNextUpdateRef.current = false;
      }
      return;
    }

    // Compare the incoming data with our current data
    const currentDataStr = JSON.stringify(currentLocationAnswersRef.current);
    const newDataStr = JSON.stringify(locationAnswers);

    // Only update if there's a real change and the new data is not empty
    if (currentDataStr !== newDataStr && locationAnswers.length > 0) {
      // IMPORTANT: Check if the data is being reset to an older version
      // If our current data has more recent updates, don't overwrite it
      let shouldUpdate = true;

      // Check if current data is more recent by comparing timestamps or changes in radius/locations
      if (currentLocationAnswersRef.current.length > 0) {
        // If we already have data with radius values different from incoming data,
        // it might be newer data the user just edited
        const hasNewerEdits = currentLocationAnswersRef.current.some((current, idx) => {
          // Only compare if we have matching locations in both arrays
          if (idx >= locationAnswers.length) return false;

          // Check if we have a more recent change in radius
          const incomingLocation = locationAnswers[idx];
          return (
            current.quizLocationAnswerId === incomingLocation.quizLocationAnswerId &&
            current.radius !== incomingLocation.radius &&
            // Only consider it newer if we're not in the initial loading
            currentDataStr !== '[]'
          );
        });

        if (hasNewerEdits) {
          console.log("Skipping location update from props because local data appears to be newer");
          shouldUpdate = false;
        }
      }

      if (shouldUpdate) {
        console.log("Updating location answers from prop:", locationAnswers);
        setLocationData(locationAnswers);
        currentLocationAnswersRef.current = locationAnswers;
        previousAnswersRef.current = locationAnswers;
      }
    }
  }, [locationAnswers, isDragging, skipNextRefresh, mapLoaded]);

  // Clean invalid locations
  useEffect(() => {
    if (locationAnswers.length === 0 && !readonly) {
      debouncedLocationChange([
        { longitude: 105.804817, latitude: 21.028511, radius: 10 }
      ]);
    } else if (locationAnswers.length > 0) {
      // Validate existing location answers
      const validatedAnswers = locationAnswers.map(loc => {
        // If coordinates are invalid, replace with defaults
        if (!isValidCoordinate(loc.longitude, loc.latitude)) {
          return {
            ...loc,
            longitude: 105.804817,
            latitude: 21.028511,
            radius: loc.radius || 10
          };
        }
        return loc;
      });

      // If we had to fix any coordinates, update the location answers
      if (JSON.stringify(validatedAnswers) !== JSON.stringify(locationAnswers)) {
        console.log("Fixed invalid coordinates in location answers");
        debouncedLocationChange(validatedAnswers);
      }
    }
  }, [locationAnswers, questionIndex, readonly]);

  // Check if we're in a browser environment
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Add some basic styling
  useEffect(() => {
    if (!isBrowser) return;

    // Add styles for markers
    const style = document.createElement('style');
    style.innerHTML = `
      .mapboxgl-canvas {
        filter: drop-shadow(0px 0px 4px rgba(0, 60, 255, 0.2));
      }
      
      .custom-marker {
        width: 24px;
        height: 24px;
        background-color: #ff0000;
        border-radius: 50%;
        border: 2px solid white;
        cursor: grab;
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
        transition: transform 0.15s ease, background-color 0.15s ease;
        will-change: transform;
      }
      
      .custom-marker.selected {
        background-color: #3b82f6;
        transform: scale(1.2);
      }

      .custom-marker.dragging {
        background-color: #10b981;
        transform: scale(1.3);
        opacity: 0.8;
        cursor: grabbing;
      }

      .fit-map-button {
        position: absolute;
        top: 80px;
        right: 10px;
        z-index: 10;
        background: white;
        color: #333;
        border-radius: 4px;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .fit-map-button:hover {
        background: #f0f0f0;
        transform: scale(1.05);
      }

      .location-marker-tooltip {
        position: absolute;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        transform: translate(-50%, -100%);
        margin-top: -10px;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [isBrowser]);

  // Initialize map
  useEffect(() => {
    if (!isBrowser || !mapContainerRef.current) return;

    // Create the map with simple 2D streets style
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: DEFAULT_MAP_STYLE,
      center: [105.804817, 21.028511], // Default center on Hanoi
      zoom: 10,
      pitch: 0, // Ensure 2D view
      bearing: 0,
      projection: 'mercator',
      renderWorldCopies: true,
      attributionControl: false
    });

    mapRef.current = map;

    // Add minimal navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMapLoaded(true);

      // Initialize existing location markers
      refreshMapMarkers();
    });

    return () => {
      // Clean up
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isBrowser]);

  // Handle location answers changes with selective updates
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || isDragging || skipNextRefresh || ignoreNextUpdateRef.current) {
      // Skip if we're dragging or if we explicitly want to skip this refresh
      if (skipNextRefresh) {
        setSkipNextRefresh(false);
      }

      if (ignoreNextUpdateRef.current) {
        ignoreNextUpdateRef.current = false;
      }
      return;
    }

    // Check if we need to do a full refresh or selective update
    if (markersRef.current.size !== locationAnswers.length) {
      // Different number of markers - do a full refresh
      refreshMapMarkers();
      return;
    }

    // Check if we can do selective updates
    let needsFullRefresh = false;

    // Update existing markers in place if possible
    locationAnswers.forEach((location, index) => {
      const marker = markersRef.current.get(index);
      const prevLocation = previousAnswersRef.current[index];

      if (marker && prevLocation) {
        // Check if coordinates changed
        if (location.longitude !== prevLocation.longitude ||
          location.latitude !== prevLocation.latitude) {
          // Update marker position
          marker.setLngLat([location.longitude, location.latitude]);
        }

        // Check if radius changed
        if (location.radius !== prevLocation.radius) {
          // Update circle radius
          updateCircle(index, location.latitude, location.longitude, location.radius);
        }

        // Update marker selection state
        const element = marker.getElement();
        if (index === selectedLocationIndex) {
          element.classList.add('selected');
        } else {
          element.classList.remove('selected');
        }
      } else {
        // Couldn't find marker or previous location - need full refresh
        needsFullRefresh = true;
      }
    });

    if (needsFullRefresh) {
      refreshMapMarkers();
    }
  }, [locationAnswers, mapLoaded, selectedLocationIndex]);

  // Listen for API updates and refresh UI
  useEffect(() => {
    const handleLocationUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.locationAnswers) {
        console.log("Received location update from API:", event.detail.locationAnswers);
        // Set flag to ignore the next render cycle to prevent jitter
        ignoreNextUpdateRef.current = true;
        debouncedLocationChange(event.detail.locationAnswers);
      }
    };

    const handleLocationAdded = (event: CustomEvent) => {
      if (event.detail && mapRef.current && mapLoaded) {
        const { index, longitude, latitude } = event.detail;

        console.log(`New location point added at index ${index}: ${longitude}, ${latitude}`);

        // Fly to the new location with animation
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          duration: 1500,
          essential: true
        });

        // Set this as the selected location
        setSelectedLocationIndex(index);

        // Set flag to ignore the next render cycle to prevent jitter
        ignoreNextUpdateRef.current = true;

        // Show a toast notification
        toast({
          title: "New location added",
          description: "Map centered on new location point",
          duration: 2000
        });
      }
    };

    const handleCoordinateUpdate = (event: CustomEvent) => {
      if (event.detail && mapRef.current && mapLoaded) {
        const { index, longitude, latitude, radius } = event.detail;

        // Update our internal reference to prevent overrides
        if (currentLocationAnswersRef.current[index]) {
          const updatedLocations = [...currentLocationAnswersRef.current];
          updatedLocations[index] = {
            ...updatedLocations[index],
            longitude: longitude,
            latitude: latitude
          };
          currentLocationAnswersRef.current = updatedLocations;
        }

        // Update marker position directly without refreshing all markers
        const marker = markersRef.current.get(index);
        if (marker) {
          marker.setLngLat([longitude, latitude]);

          // Update circle with new radius if provided
          updateCircle(index, latitude, longitude, radius || currentLocationAnswersRef.current[index]?.radius || 10);

          // Skip the next refresh cycle to prevent jitter
          setSkipNextRefresh(true);

          // Set flag to ignore the next render cycle 
          ignoreNextUpdateRef.current = true;

          console.log(`Updated marker position for index ${index}: ${longitude}, ${latitude}`);
        }
      }
    };

    const handleRadiusUpdate = (event: CustomEvent) => {
      if (event.detail && mapRef.current && mapLoaded) {
        const { index, radius } = event.detail;

        // Update our internal reference to prevent overrides
        if (currentLocationAnswersRef.current[index]) {
          const updatedLocations = [...currentLocationAnswersRef.current];
          updatedLocations[index] = {
            ...updatedLocations[index],
            radius: radius
          };
          currentLocationAnswersRef.current = updatedLocations;
        }

        // Get the current marker position
        const marker = markersRef.current.get(index);
        if (marker) {
          const position = marker.getLngLat();

          // Update circle with new radius
          updateCircle(index, position.lat, position.lng, radius);

          // Skip the next refresh cycle to prevent jitter
          setSkipNextRefresh(true);

          // Set flag to ignore the next render cycle 
          ignoreNextUpdateRef.current = true;

          console.log(`Updated radius for location ${index} to ${radius}km`);
        }
      }
    };

    const handleLocationRemoved = (event: CustomEvent) => {
      if (event.detail && mapRef.current && mapLoaded) {
        const { index } = event.detail;

        // Remove the marker
        const marker = markersRef.current.get(index);
        if (marker) {
          marker.remove();
          markersRef.current.delete(index);
        }

        // Remove the circle layers
        const circleId = `circle-${index}`;
        const borderLayerId = `${circleId}-border`;

        if (mapRef.current.getLayer(borderLayerId)) {
          mapRef.current.removeLayer(borderLayerId);
        }

        if (mapRef.current.getLayer(circleId)) {
          mapRef.current.removeLayer(circleId);
        }

        if (mapRef.current.getSource(circleId)) {
          mapRef.current.removeSource(circleId);
        }

        circlesRef.current.delete(index);

        // Update our internal reference
        currentLocationAnswersRef.current = currentLocationAnswersRef.current.filter((_, i) => i !== index);

        // Skip the next refresh cycle since we've already updated the UI
        setSkipNextRefresh(true);

        // Set flag to ignore the next render cycle 
        ignoreNextUpdateRef.current = true;

        console.log(`Removed location point at index ${index}`);
      }
    };

    const handleSyncRequest = (event: CustomEvent) => {
      if (mapRef.current && mapLoaded && currentLocationAnswersRef.current.length > 0) {
        // Compare current state with our reference to see if we need to update
        const currentAnswers = JSON.stringify(currentLocationAnswersRef.current);
        const propAnswers = JSON.stringify(locationAnswers);

        if (currentAnswers !== propAnswers) {
          console.log("Syncing map markers with current location data (from ref)");
          // Use our internal reference for refresh to ensure latest data is shown
          refreshMapMarkersWithData(currentLocationAnswersRef.current);
        } else {
          console.log("Syncing map markers with prop location data");
          // Force a refresh of all markers to ensure map is in sync with settings
          refreshMapMarkers();
        }
      }
    };

    const handleForceSync = (event: CustomEvent) => {
      if (!event.detail) return;

      // Skip if we're dragging or about to handle another update
      if (isDragging || skipNextRefresh || ignoreNextUpdateRef.current) return;

      // Get the data and metadata from the event
      const { locationData, timestamp, source } = event.detail;

      // Skip if no data was provided
      if (!locationData || !Array.isArray(locationData)) return;

      // Add timestamp-based checking to avoid overriding newer changes with older data
      if (typeof window !== 'undefined' && window.lastLocationUpdate) {
        // If this sync event has older data than our last update, ignore it
        if (timestamp && window.lastLocationUpdate.timestamp > timestamp) {
          console.log("Ignoring force sync with older data timestamp:",
            `Last: ${window.lastLocationUpdate.timestamp} > Event: ${timestamp}`);
          return;
        }

        // If data is coming from the same component that last updated, always accept it
        if (source === 'editor' && source === window.lastLocationUpdate.source) {
          // Allow editor to update itself
        }
        // Otherwise compare the actual data
        else {
          const currentDataStr = JSON.stringify(currentLocationAnswersRef.current);
          const newDataStr = JSON.stringify(locationData);

          if (currentDataStr === newDataStr) {
            // Data is identical, no need to update
            return;
          }
        }
      }

      console.log("Force syncing location data from event:", { source, locationData });

      // Update all the relevant state and refs
      setLocationData(locationData);
      previousAnswersRef.current = locationData;
      currentLocationAnswersRef.current = locationData;

      // If the map is loaded, update the markers
      if (mapLoaded && mapRef.current) {
        refreshMapMarkers(locationData);
      }

      // Update window.lastLocationUpdate with the new data
      if (typeof window !== 'undefined') {
        window.lastLocationUpdate = {
          timestamp: timestamp || Date.now(),
          activityId: '',  // No activity reference available in this component
          locationData: locationData,
          source: 'editor'
        };
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('location:answers:updated', handleLocationUpdate as EventListener);
      window.addEventListener('location:point:added', handleLocationAdded as EventListener);
      window.addEventListener('location:coordinate:updated', handleCoordinateUpdate as EventListener);
      window.addEventListener('location:radius:updated', handleRadiusUpdate as EventListener);
      window.addEventListener('location:point:removed', handleLocationRemoved as EventListener);
      window.addEventListener('location:sync:request', handleSyncRequest as EventListener);
      window.addEventListener('location:force:sync', handleForceSync as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('location:answers:updated', handleLocationUpdate as EventListener);
        window.removeEventListener('location:point:added', handleLocationAdded as EventListener);
        window.removeEventListener('location:coordinate:updated', handleCoordinateUpdate as EventListener);
        window.removeEventListener('location:radius:updated', handleRadiusUpdate as EventListener);
        window.removeEventListener('location:point:removed', handleLocationRemoved as EventListener);
        window.removeEventListener('location:sync:request', handleSyncRequest as EventListener);
        window.removeEventListener('location:force:sync', handleForceSync as EventListener);
      }
    };
  }, [mapLoaded, locationAnswers]);

  // Add debugging for when location answers update from props
  useEffect(() => {
    // Only log significant changes to avoid console spam
    if (locationAnswers && locationAnswers.length > 0) {
      console.log(`[DEBUG] Location answers updated from props (${locationAnswers.length} answers)`);

      // Log detailed diff if answers changed significantly
      if (currentLocationAnswersRef.current && currentLocationAnswersRef.current.length > 0) {
        const anyChanged = locationAnswers.some((answer, idx) => {
          if (idx >= currentLocationAnswersRef.current.length) return true;
          const current = currentLocationAnswersRef.current[idx];

          // Check for significant changes (more than tiny rounding differences)
          const latChanged = Math.abs(answer.latitude - current.latitude) > 0.0001;
          const lngChanged = Math.abs(answer.longitude - current.longitude) > 0.0001;
          const radiusChanged = answer.radius !== current.radius;

          if (latChanged || lngChanged || radiusChanged) {
            console.log(`[DEBUG] Significant change in location ${idx}:`, {
              latitude: { old: current.latitude, new: answer.latitude, changed: latChanged },
              longitude: { old: current.longitude, new: answer.longitude, changed: lngChanged },
              radius: { old: current.radius, new: answer.radius, changed: radiusChanged }
            });
            return true;
          }
          return false;
        });

        if (anyChanged) {
          console.log(`[DEBUG] Location data update source:`, {
            lastUpdate: typeof window !== 'undefined' ? window.lastLocationUpdate : null,
            isDragging,
            skipNextRefresh,
            ignoreNextUpdate: ignoreNextUpdateRef.current
          });
        }
      }
    }
  }, [locationAnswers]);

  // Function to create a GeoJSON circle
  function createGeoJSONCircle(center: [number, number], radiusInKm: number, points: number = 64): Feature<Polygon> {
    // Validate the center coordinates
    if (!isValidCoordinate(center[0], center[1])) {
      console.warn("Invalid coordinates for circle center, using default:", center);
      // Use default coordinates instead
      center = [105.804817, 21.028511];
    }

    // Ensure radius is valid
    const radius = radiusInKm > 0 ? radiusInKm : 10;

    const coords = {
      latitude: center[1],
      longitude: center[0]
    };

    const km = radius;
    const ret = [];
    const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;

    let theta, x, y;
    for (let i = 0; i < points; i++) {
      theta = (i / points) * (2 * Math.PI);
      x = distanceX * Math.cos(theta);
      y = distanceY * Math.sin(theta);
      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]); // Close the loop

    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [ret]
      }
    };
  }

  // Function to update or create circle for a location marker
  function updateCircle(index: number, lat: number, lng: number, radiusInKm: number) {
    if (!mapRef.current || !mapLoaded) return;

    // Skip if coordinates are invalid
    if (!isValidCoordinate(lng, lat)) {
      console.warn("Invalid coordinates for circle:", lng, lat);
      return;
    }

    const circleId = `circle-${index}`;
    const circleData = createGeoJSONCircle([lng, lat], radiusInKm);

    // Check if the source already exists
    if (mapRef.current.getSource(circleId)) {
      // Update existing circle
      (mapRef.current.getSource(circleId) as mapboxgl.GeoJSONSource).setData(circleData);
    } else {
      // Create new circle source and layers
      try {
        // Add the GeoJSON source
        mapRef.current.addSource(circleId, {
          type: "geojson",
          data: circleData
        });

        // Add the fill layer
        mapRef.current.addLayer({
          id: circleId,
          type: "fill",
          source: circleId,
          paint: {
            "fill-color": index === selectedLocationIndex ? "#3b82f6" : "#ff0000",
            "fill-opacity": 0.2
          }
        });

        // Add the outline layer
        mapRef.current.addLayer({
          id: `${circleId}-border`,
          type: "line",
          source: circleId,
          paint: {
            "line-color": index === selectedLocationIndex ? "#3b82f6" : "#ff0000",
            "line-width": 2
          }
        });

        // Store the circle source reference
        circlesRef.current.set(index, mapRef.current.getSource(circleId) as mapboxgl.GeoJSONSource);
      } catch (error) {
        console.error("Error adding circle to map:", error);
      }
    }
  }

  // Function to create a draggable marker
  function createDraggableMarker(lngLat: [number, number], index: number) {
    // Create marker element
    const element = document.createElement('div');
    element.className = `custom-marker ${index === selectedLocationIndex ? 'selected' : ''}`;

    // Create the marker
    const marker = new mapboxgl.Marker({
      element,
      draggable: !readonly
    })
      .setLngLat(lngLat)
      .addTo(mapRef.current!);

    // Add click handler to select this marker
    element.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent map click
      setSelectedLocationIndex(index);
    });

    // Add drag start, drag, and drag end events if not in readonly mode
    if (!readonly) {
      marker.on('dragstart', () => {
        element.classList.add('dragging');
        setDraggedMarkerIndex(index);
        setIsDragging(true);

        // Set flag to ignore the next render cycle 
        ignoreNextUpdateRef.current = true;
      });

      marker.on('drag', () => {
        // Update the circle position during drag for visual feedback
        const position = marker.getLngLat();
        if (mapRef.current && mapLoaded) {
          updateCircle(index, position.lat, position.lng, currentLocationAnswersRef.current[index]?.radius || 10);
        }
      });

      marker.on('dragend', () => {
        element.classList.remove('dragging');
        const position = marker.getLngLat();

        // Update the location data directly in place
        const updatedLocations = [...currentLocationAnswersRef.current];
        updatedLocations[index] = {
          ...updatedLocations[index],
          longitude: position.lng,
          latitude: position.lat
        };

        // Update our reference immediately
        currentLocationAnswersRef.current = updatedLocations;

        // Small delay to ensure smooth visual transition
        setTimeout(() => {
          setIsDragging(false);
          setDraggedMarkerIndex(-1);

          // Skip the next refresh cycle since we've already updated the marker
          setSkipNextRefresh(true);

          // Set flag to ignore the next render cycle 
          ignoreNextUpdateRef.current = true;

          // Update the data
          debouncedLocationChange(updatedLocations);
        }, 50);
      });
    }

    return marker;
  }

  // Function to fit map to show all markers
  const fitMapToMarkers = () => {
    if (!mapRef.current || currentLocationAnswersRef.current.length === 0) return;

    // Filter out invalid coordinates
    const validLocations = currentLocationAnswersRef.current.filter(loc =>
      isValidCoordinate(loc.longitude, loc.latitude)
    );

    if (validLocations.length === 0) return;

    // Create a bounds object
    const bounds = new mapboxgl.LngLatBounds();

    // Extend the bounds to include each marker
    validLocations.forEach(loc => {
      bounds.extend([loc.longitude, loc.latitude]);
    });

    // Fit the map to the bounds with some padding
    mapRef.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14,
      duration: 1000 // Smooth animation
    });

    // Show a brief toast message
    toast({
      title: "Map view adjusted",
      description: `Showing all ${validLocations.length} location points`,
      duration: 2000
    });
  };

  // Refresh all markers on the map using specified data
  function refreshMapMarkersWithData(locData: LocationAnswer[]) {
    if (!mapRef.current || !mapLoaded || isDragging) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current.clear();

    // Remove existing circle layers
    circlesRef.current.forEach((_, index) => {
      const circleId = `circle-${index}`;
      const borderLayerId = `${circleId}-border`;

      if (mapRef.current!.getLayer(borderLayerId)) {
        mapRef.current!.removeLayer(borderLayerId);
      }

      if (mapRef.current!.getLayer(circleId)) {
        mapRef.current!.removeLayer(circleId);
      }

      if (mapRef.current!.getSource(circleId)) {
        mapRef.current!.removeSource(circleId);
      }
    });
    circlesRef.current.clear();

    // Create markers for each location answer
    locData.forEach((location, index) => {
      // Skip invalid coordinates
      if (!isValidCoordinate(location.longitude, location.latitude)) {
        console.warn("Skipping invalid coordinates", location);
        return;
      }

      const lngLat = [location.longitude, location.latitude] as [number, number];

      // Create a draggable marker
      const marker = createDraggableMarker(lngLat, index);

      // Store marker reference
      markersRef.current.set(index, marker);

      // Update the circle for this location
      updateCircle(index, location.latitude, location.longitude, location.radius || 10);
    });

    // If we have at least one location, fit the map to show all markers
    if (locData.length > 0 && mapRef.current) {
      // Filter out invalid coordinates
      const validLocations = locData.filter(loc =>
        isValidCoordinate(loc.longitude, loc.latitude)
      );

      if (validLocations.length > 0) {
        // Create a bounds object
        const bounds = new mapboxgl.LngLatBounds();

        // Extend the bounds to include each valid location
        validLocations.forEach(loc => {
          bounds.extend([loc.longitude, loc.latitude]);
        });

        // Set the map's bounds with some padding
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 12
        });
      }
    }
  }

  // Refresh all markers on the map using prop data
  function refreshMapMarkers(dataOverride?: LocationAnswer[]) {
    // Use dataOverride if provided, otherwise use locationData state if available, falling back to locationAnswers prop
    const dataToUse = dataOverride || (locationData.length > 0 ? locationData : locationAnswers);
    refreshMapMarkersWithData(dataToUse);
  }

  // Helper function to validate coordinates
  function isValidCoordinate(lng: any, lat: any): boolean {
    return (
      typeof lng === 'number' &&
      typeof lat === 'number' &&
      !isNaN(lng) &&
      !isNaN(lat) &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90
    );
  }

  // Debounced update handler to reduce API calls
  const debouncedLocationChange = (newLocationData: LocationAnswer[]) => {
    // Cancel previous timer if it exists
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Skip if data hasn't changed from last update
    const newDataString = JSON.stringify(newLocationData);
    if (newDataString === lastLocationDataRef.current) {
      return;
    }

    // Update our reference immediately
    currentLocationAnswersRef.current = newLocationData;

    // Update our ref to track the latest data
    lastLocationDataRef.current = newDataString;

    // Set timeout for the actual update
    debounceTimerRef.current = setTimeout(() => {
      onLocationChange(questionIndex, newLocationData);
      debounceTimerRef.current = null;
    }, 500); // Reduced debounce time for better responsiveness
  };

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full relative">
      <Card className="shadow-md border-0">
        <CardContent className="p-0">
          <div
            ref={mapContainerRef}
            className="w-full rounded-md overflow-hidden"
            style={{ height: "400px" }}
          />

          {/* Zoom to fit button */}
          {locationAnswers.length > 1 && (
            <button
              className="fit-map-button"
              onClick={fitMapToMarkers}
              title="Zoom to fit all locations"
            >
              <Maximize size={16} />
            </button>
          )}
        </CardContent>
      </Card>

      {/* Show All button for multiple locations */}
      {locationAnswers.length > 1 && (
        <Button
          variant="outline"
          onClick={fitMapToMarkers}
          title="Zoom to fit all location points"
          className="mt-2"
        >
          <Maximize className="mr-2 h-4 w-4" />
          Show All Locations
        </Button>
      )}
    </div>
  );
}