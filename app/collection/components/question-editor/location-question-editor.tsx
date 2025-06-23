'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Maximize, Search, MapPin, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Feature, Polygon } from 'geojson';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
mapboxgl.accessToken =
  'pk.eyJ1IjoiY2NkY2MxMSIsImEiOiJjbWFnbXduZDkwMmV6MnFzbDIxM3dxMTJ4In0.2-eYJyMMthGbAa9SOtCDbQ';

// Define default map style (streetline 2D)
const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

// Interface for location answers
interface LocationAnswer {
  quizLocationAnswerId?: string;
  longitude: number;
  latitude: number;
  radius: number;
}

interface LocationQuestionEditorProps {
  questionText: string;
  locationAnswers?: LocationAnswer[];
  onLocationChange: (
    questionIndex: number,
    locationData: LocationAnswer[]
  ) => void;
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
  const [locationData, setLocationData] =
    useState<LocationAnswer[]>(locationAnswers);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] =
    useState<number>(-1);
  const [draggedMarkerIndex, setDraggedMarkerIndex] = useState<number>(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [skipNextRefresh, setSkipNextRefresh] = useState(false);
  const previousAnswersRef = useRef<LocationAnswer[]>(locationAnswers);
  const ignoreNextUpdateRef = useRef<boolean>(false);
  const [markers, setMarkers] = useState<LocationAnswer[]>([]);
  const [renderKey, setRenderKey] = useState(0);

  // Add new ref to track drag operations and prevent interference
  const dragOperationRef = useRef<{
    isDragging: boolean;
    markerIndex: number;
    newPosition?: { lng: number; lat: number };
    timestamp: number;
  } | null>(null);

  // Add ref to track latest coordinates after drag
  const latestMarkerPositionsRef = useRef<
    Map<number, { lng: number; lat: number }>
  >(new Map());

  const { toast } = useToast();

  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Context menu states
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    lng: number;
    lat: number;
    visible: boolean;
  } | null>(null);

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

    // **CRITICAL FIX**: Skip updates during drag operations
    if (dragOperationRef.current?.isDragging) {
      console.log('⚠️ Skipping location update during drag operation');
      return;
    }

    // **NEW**: Check if this update is from our own drag operation
    if (typeof window !== 'undefined' && window.lastLocationUpdate) {
      const timeSinceLastUpdate =
        Date.now() - window.lastLocationUpdate.timestamp;
      // If update happened very recently (within 1 second) and from location editor, it might be our own update
      if (
        timeSinceLastUpdate < 1000 &&
        window.lastLocationUpdate.source?.includes('location-editor')
      ) {
        console.log(
          '⚠️ Skipping props update - appears to be from our own drag operation'
        );
        return;
      }
    }

    // Compare the incoming data with our current data
    const currentDataStr = JSON.stringify(currentLocationAnswersRef.current);
    const newDataStr = JSON.stringify(locationAnswers);

    // Only update if there's a real change and the new data is valid
    if (currentDataStr !== newDataStr && locationAnswers.length > 0) {
      // **NEW**: Check for coordinate conflicts with recently dragged markers
      let shouldUpdate = true;

      // Check if current data is more recent by comparing timestamps or changes
      if (currentLocationAnswersRef.current.length > 0) {
        const hasNewerEdits = currentLocationAnswersRef.current.some(
          (current, idx) => {
            if (idx >= locationAnswers.length) return false;

            const incomingLocation = locationAnswers[idx];

            // **NEW**: Check if we have a more recent drag position for this marker
            const latestPosition = latestMarkerPositionsRef.current.get(idx);
            if (latestPosition) {
              const positionDiff =
                Math.abs(latestPosition.lng - incomingLocation.longitude) +
                Math.abs(latestPosition.lat - incomingLocation.latitude);
              // If positions differ significantly, prefer our latest drag position
              if (positionDiff > 0.000001) {
                console.log(
                  `⚠️ Coordinate conflict for marker ${idx} - keeping dragged position`
                );
                return true;
              }
            }

            return (
              current.quizLocationAnswerId ===
              incomingLocation.quizLocationAnswerId &&
              current.radius !== incomingLocation.radius &&
              currentDataStr !== '[]'
            );
          }
        );

        if (hasNewerEdits) {
          console.log(
            'Skipping location update from props because local data appears to be newer'
          );
          shouldUpdate = false;
        }
      }

      if (shouldUpdate) {
        console.log('Updating location answers from prop:', locationAnswers);
        setLocationData(locationAnswers);
        currentLocationAnswersRef.current = [...locationAnswers];
        previousAnswersRef.current = [...locationAnswers];

        // **CRITICAL**: Clear latest positions after successful update to avoid conflicts
        latestMarkerPositionsRef.current.clear();

        // Refresh map with new data
        if (mapLoaded && mapRef.current) {
          refreshMapMarkersWithData(locationAnswers);
        }
      }
    }
  }, [locationAnswers, isDragging, skipNextRefresh, mapLoaded]);

  // Clean invalid locations and initialize if empty
  useEffect(() => {
    if (locationAnswers.length === 0 && !readonly) {
      const defaultLocation = {
        longitude: 105.804817,
        latitude: 21.028511,
        radius: 10,
      };
      debouncedLocationChange([defaultLocation]);
    } else if (locationAnswers.length > 0) {
      // Validate existing location answers
      const validatedAnswers = locationAnswers.map((loc) => {
        if (!isValidCoordinate(loc.longitude, loc.latitude)) {
          return {
            ...loc,
            longitude: 105.804817,
            latitude: 21.028511,
            radius: loc.radius || 10,
          };
        }
        return loc;
      });

      // If we had to fix any coordinates, update the location answers
      if (
        JSON.stringify(validatedAnswers) !== JSON.stringify(locationAnswers)
      ) {
        console.log('Fixed invalid coordinates in location answers');
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
        position: relative;
        z-index: 1;
      }
      
      .custom-marker.selected {
        background-color: #3b82f6;
        transform: scale(1.2);
        z-index: 2;
      }

      .custom-marker.dragging {
        background-color: #10b981;
        transform: scale(1.3);
        opacity: 0.8;
        cursor: grabbing;
        z-index: 3;
      }

      /* Styles for multiple markers with numbers */
      .custom-marker span {
        pointer-events: none;
        user-select: none;
      }

      .fit-map-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        transition: background-color 0.2s ease;
      }

      .fit-map-button:hover {
        background: #f0f0f0;
      }

      .fit-map-button svg {
        color: #666;
      }

      /* Mapbox popup styling */
      .mapboxgl-popup-content {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 12px;
        max-width: 200px;
      }

      .mapboxgl-popup-anchor-top .mapboxgl-popup-tip,
      .mapboxgl-popup-anchor-top-left .mapboxgl-popup-tip,
      .mapboxgl-popup-anchor-top-right .mapboxgl-popup-tip {
        border-bottom-color: rgba(255, 255, 255, 0.95);
      }

      .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip,
      .mapboxgl-popup-anchor-bottom-left .mapboxgl-popup-tip,
      .mapboxgl-popup-anchor-bottom-right .mapboxgl-popup-tip {
        border-top-color: rgba(255, 255, 255, 0.95);
      }

      .mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
        border-right-color: rgba(255, 255, 255, 0.95);
      }

      .mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
        border-left-color: rgba(255, 255, 255, 0.95);
      }
    `;

    document.head.appendChild(style);

    return () => {
      // Cleanup: remove the style element when component unmounts
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
      attributionControl: false,
    });

    mapRef.current = map;

    // Add minimal navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      setMapLoaded(true);

      // Initialize existing location markers
      refreshMapMarkers();
    });

    // Add context menu event handler
    map.on('contextmenu', (e) => {
      console.log('🖱️ Right click detected on map');

      if (readonly) {
        console.log('❌ Context menu disabled - readonly mode');
        return;
      }

      e.preventDefault();

      const { lng, lat } = e.lngLat;
      const { x, y } = e.point;

      console.log('📍 Context menu position:', { x, y, lng, lat });

      setContextMenu({
        x,
        y,
        lng,
        lat,
        visible: true
      });

      console.log('✅ Context menu should be visible now');
    });

    // Hide context menu on regular click
    map.on('click', () => {
      setContextMenu(null);
    });

    return () => {
      // Clean up
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isBrowser]);

  // Handle location answers changes with selective updates
  useEffect(() => {
    if (
      !mapLoaded ||
      !mapRef.current ||
      isDragging ||
      skipNextRefresh ||
      ignoreNextUpdateRef.current
    ) {
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
        if (
          location.longitude !== prevLocation.longitude ||
          location.latitude !== prevLocation.latitude
        ) {
          // Update marker position
          marker.setLngLat([location.longitude, location.latitude]);
        }

        // Check if radius changed
        if (location.radius !== prevLocation.radius) {
          // Update circle radius
          updateCircle(
            index,
            location.latitude,
            location.longitude,
            location.radius
          );
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
      if (event.detail?.locationAnswers && !isDragging) {
        // **NEW**: Check if this update conflicts with recent drag operations
        if (dragOperationRef.current?.isDragging) {
          console.log('⚠️ Ignoring location update during drag operation');
          return;
        }

        // **NEW**: Check for drag conflicts before updating
        const incomingAnswers = event.detail.locationAnswers;
        let hasConflicts = false;

        for (let i = 0; i < incomingAnswers.length; i++) {
          const latestPosition = latestMarkerPositionsRef.current.get(i);
          if (latestPosition) {
            const positionDiff =
              Math.abs(latestPosition.lng - incomingAnswers[i].longitude) +
              Math.abs(latestPosition.lat - incomingAnswers[i].latitude);
            if (positionDiff > 0.000001) {
              console.log(
                `⚠️ Position conflict detected for marker ${i + 1
                } - keeping drag position`
              );
              hasConflicts = true;
              break;
            }
          }
        }

        if (!hasConflicts) {
          // Safe to update from external source
          setLocationData(incomingAnswers);
          currentLocationAnswersRef.current = incomingAnswers;

          // **NEW**: Clear latest positions since we're accepting external update
          latestMarkerPositionsRef.current.clear();

          if (mapLoaded && mapRef.current) {
            refreshMapMarkersWithData(incomingAnswers);
          }
        }
      }
    };

    // **NEW**: Add cleanup handler for successful API responses
    const handleApiResponseSuccess = (event: CustomEvent) => {
      if (event.detail?.source?.includes('location-quiz-api-success')) {
        console.log('✅ API response success - clearing drag positions');
        // Clear latest positions after successful API response
        setTimeout(() => {
          if (!dragOperationRef.current?.isDragging) {
            latestMarkerPositionsRef.current.clear();
          }
        }, 500);
      }
    };

    const handleLocationAdded = (event: CustomEvent) => {
      if (
        event.detail &&
        typeof event.detail.longitude === 'number' &&
        typeof event.detail.latitude === 'number'
      ) {
        const newLocation: LocationAnswer = {
          longitude: event.detail.longitude,
          latitude: event.detail.latitude,
          radius: event.detail.radius || 10,
        };

        const updatedData = [...currentLocationAnswersRef.current, newLocation];
        setLocationData(updatedData);
        currentLocationAnswersRef.current = updatedData;

        // Force immediate refresh if event indicates it
        if (event.detail.immediate && mapLoaded && mapRef.current) {
          refreshMapMarkersWithData(updatedData);
        }
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
            latitude: latitude,
          };
          currentLocationAnswersRef.current = updatedLocations;
        }

        // Update marker position directly without refreshing all markers
        const marker = markersRef.current.get(index);
        if (marker) {
          marker.setLngLat([longitude, latitude]);

          // Update circle with new radius if provided
          updateCircle(
            index,
            latitude,
            longitude,
            radius || currentLocationAnswersRef.current[index]?.radius || 10
          );

          // Skip the next refresh cycle to prevent jitter
          setSkipNextRefresh(true);

          // Set flag to ignore the next render cycle
          ignoreNextUpdateRef.current = true;

          console.log(
            `Updated marker position for index ${index}: ${longitude}, ${latitude}`
          );
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
            radius: radius,
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
        currentLocationAnswersRef.current =
          currentLocationAnswersRef.current.filter((_, i) => i !== index);

        // Skip the next refresh cycle since we've already updated the UI
        setSkipNextRefresh(true);

        // Set flag to ignore the next render cycle
        ignoreNextUpdateRef.current = true;

        console.log(`Removed location point at index ${index}`);
      }
    };

    const handleSyncRequest = (event: CustomEvent) => {
      if (
        mapRef.current &&
        mapLoaded &&
        currentLocationAnswersRef.current.length > 0
      ) {
        // Compare current state with our reference to see if we need to update
        const currentAnswers = JSON.stringify(
          currentLocationAnswersRef.current
        );
        const propAnswers = JSON.stringify(locationAnswers);

        if (currentAnswers !== propAnswers) {
          console.log(
            'Syncing map markers with current location data (from ref)'
          );
          // Use our internal reference for refresh to ensure latest data is shown
          refreshMapMarkersWithData(currentLocationAnswersRef.current);
        } else {
          console.log('Syncing map markers with prop location data');
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
          console.log(
            'Ignoring force sync with older data timestamp:',
            `Last: ${window.lastLocationUpdate.timestamp} > Event: ${timestamp}`
          );
          return;
        }

        // If data is coming from the same component that last updated, always accept it
        if (
          source === 'editor' &&
          source === window.lastLocationUpdate.source
        ) {
          // Allow editor to update itself
        }
        // Otherwise compare the actual data
        else {
          const currentDataStr = JSON.stringify(
            currentLocationAnswersRef.current
          );
          const newDataStr = JSON.stringify(locationData);

          if (currentDataStr === newDataStr) {
            // Data is identical, no need to update
            return;
          }
        }
      }

      console.log('Force syncing location data from event:', {
        source,
        locationData,
      });

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
          activityId: '', // No activity reference available in this component
          locationData: locationData,
          source: 'editor',
        };
      }
    };

    const handleKeepUIPosition = (event: CustomEvent) => {
      if (!event.detail || !event.detail.locationAnswers) return;

      console.log('🎯 Keeping UI at new position after successful API call');

      const { locationAnswers, timestamp, source } = event.detail;

      // Update our internal references to match the API response
      currentLocationAnswersRef.current = locationAnswers;
      setLocationData(locationAnswers);
      previousAnswersRef.current = locationAnswers;

      // Update global state to prevent conflicts
      if (typeof window !== 'undefined') {
        window.lastLocationUpdate = {
          timestamp: timestamp,
          activityId: questionIndex.toString(),
          locationData: locationAnswers,
          source: source,
        };
      }

      // Disable next refresh to prevent markers from moving
      setSkipNextRefresh(true);
      ignoreNextUpdateRef.current = true;

      console.log('✅ UI position locked at new coordinates');
    };

    const handleRevertPosition = (event: CustomEvent) => {
      if (!event.detail || !event.detail.error) return;

      console.log('❌ Reverting UI to previous position due to API error');

      // Revert to previous state
      if (previousAnswersRef.current && previousAnswersRef.current.length > 0) {
        currentLocationAnswersRef.current = [...previousAnswersRef.current];
        setLocationData([...previousAnswersRef.current]);

        // Refresh markers to show previous position
        if (mapLoaded && mapRef.current) {
          refreshMapMarkersWithData(previousAnswersRef.current);
        }
      }

      console.log('↩️ UI reverted to previous position');
    };

    const handlePointsUpdated = (event: CustomEvent) => {
      if (event.detail && event.detail.locationAnswers) {
        /* setMarkers(event.detail.locationAnswers.map((location: any) => ({
          longitude: location.longitude,
          latitude: location.latitude,
          radius: location.radius || 10,
          quizLocationAnswerId: location.quizLocationAnswerId || ""
        }))); */

        // Force map update
        if (mapRef.current) {
          // ... existing code ...
        }

        // Re-initialize markers with the server data
        initializeMarkers(event.detail.locationAnswers);

        // Force redraw
        setRenderKey((prev: number) => prev + 1);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'location:answers:updated',
        handleLocationUpdate as EventListener
      );
      window.addEventListener(
        'location:point:added',
        handleLocationAdded as EventListener
      );
      window.addEventListener(
        'location:coordinate:updated',
        handleCoordinateUpdate as EventListener
      );
      window.addEventListener(
        'location:radius:updated',
        handleRadiusUpdate as EventListener
      );
      window.addEventListener(
        'location:point:removed',
        handleLocationRemoved as EventListener
      );
      window.addEventListener(
        'location:sync:request',
        handleSyncRequest as EventListener
      );
      window.addEventListener(
        'location:force:sync',
        handleForceSync as EventListener
      );
      window.addEventListener(
        'location:keep:ui:position',
        handleKeepUIPosition as EventListener
      );
      window.addEventListener(
        'location:revert:position',
        handleRevertPosition as EventListener
      );
      // **NEW**: Add listener for API response success

      window.addEventListener('location:api:success', handleApiResponseSuccess as EventListener);
      window.addEventListener('location:marker:dragend', handleMarkerDragEnd as EventListener);
      window.addEventListener('location:points:updated', handlePointsUpdated as EventListener);

    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'location:answers:updated',
          handleLocationUpdate as EventListener
        );
        window.removeEventListener(
          'location:point:added',
          handleLocationAdded as EventListener
        );
        window.removeEventListener(
          'location:coordinate:updated',
          handleCoordinateUpdate as EventListener
        );
        window.removeEventListener(
          'location:radius:updated',
          handleRadiusUpdate as EventListener
        );
        window.removeEventListener(
          'location:point:removed',
          handleLocationRemoved as EventListener
        );
        window.removeEventListener(
          'location:sync:request',
          handleSyncRequest as EventListener
        );
        window.removeEventListener(
          'location:force:sync',
          handleForceSync as EventListener
        );
        window.removeEventListener(
          'location:keep:ui:position',
          handleKeepUIPosition as EventListener
        );
        window.removeEventListener(
          'location:revert:position',
          handleRevertPosition as EventListener
        );
        // **NEW**: Remove listener for API response success

        window.removeEventListener('location:api:success', handleApiResponseSuccess as EventListener);
        window.removeEventListener('location:marker:dragend', handleMarkerDragEnd as EventListener);
        window.removeEventListener('location:points:updated', handlePointsUpdated as EventListener);

      }
    };
  }, [mapLoaded, locationAnswers]);

  // Add debugging for when location answers update from props
  useEffect(() => {
    // Only log significant changes to avoid console spam
    if (locationAnswers && locationAnswers.length > 0) {
      console.log(
        `[DEBUG] Location answers updated from props (${locationAnswers.length} answers)`
      );

      // Log detailed diff if answers changed significantly
      if (
        currentLocationAnswersRef.current &&
        currentLocationAnswersRef.current.length > 0
      ) {
        const anyChanged = locationAnswers.some((answer, idx) => {
          if (idx >= currentLocationAnswersRef.current.length) return true;
          const current = currentLocationAnswersRef.current[idx];

          // Check for significant changes (more than tiny rounding differences)
          const latChanged =
            Math.abs(answer.latitude - current.latitude) > 0.0001;
          const lngChanged =
            Math.abs(answer.longitude - current.longitude) > 0.0001;
          const radiusChanged = answer.radius !== current.radius;

          if (latChanged || lngChanged || radiusChanged) {
            console.log(`[DEBUG] Significant change in location ${idx}:`, {
              latitude: {
                old: current.latitude,
                new: answer.latitude,
                changed: latChanged,
              },
              longitude: {
                old: current.longitude,
                new: answer.longitude,
                changed: lngChanged,
              },
              radius: {
                old: current.radius,
                new: answer.radius,
                changed: radiusChanged,
              },
            });
            return true;
          }
          return false;
        });

        if (anyChanged) {
          console.log(`[DEBUG] Location data update source:`, {
            lastUpdate:
              typeof window !== 'undefined' ? window.lastLocationUpdate : null,
            isDragging,
            skipNextRefresh,
            ignoreNextUpdate: ignoreNextUpdateRef.current,
          });
        }
      }
    }
  }, [locationAnswers]);

  // Add this handler function immediately after the handleApiResponseSuccess function (around line 480)

  const handleMarkerDragEnd = (event: CustomEvent) => {
    if (event.detail) {
      const {
        questionIndex: eventQuestionIndex,
        locationData,
        markerIndex,
        timestamp,
      } = event.detail;

      // Only process if this is for our question index
      if (eventQuestionIndex === questionIndex && locationData) {
        console.log(
          `🎯 Processing marker drag end event for marker ${markerIndex + 1}`
        );

        // Update our internal state with the new location data
        setLocationData(locationData);
        currentLocationAnswersRef.current = locationData;

        // Store latest position to prevent override
        if (typeof markerIndex === 'number' && markerIndex >= 0) {
          const location = locationData[markerIndex];
          if (location) {
            latestMarkerPositionsRef.current.set(markerIndex, {
              lng: location.longitude,
              lat: location.latitude,
            });
          }
        }
      }
    }
  };
  // Function to create a GeoJSON circle
  function createGeoJSONCircle(
    center: [number, number],
    radiusInKm: number,
    points: number = 64
  ): Feature<Polygon> {
    // Validate the center coordinates
    if (!isValidCoordinate(center[0], center[1])) {
      console.warn(
        'Invalid coordinates for circle center, using default:',
        center
      );
      // Use default coordinates instead
      center = [105.804817, 21.028511];
    }

    // Ensure radius is valid
    const radius = radiusInKm > 0 ? radiusInKm : 10;

    const coords = {
      latitude: center[1],
      longitude: center[0],
    };

    const km = radius;
    const ret = [];
    const distanceX =
      km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
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
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [ret],
      },
    };
  }

  // Function to update or create circle for a location marker
  function updateCircle(
    index: number,
    lat: number,
    lng: number,
    radiusInKm: number
  ) {
    if (!mapRef.current || !mapLoaded) return;

    // Skip if coordinates are invalid
    if (!isValidCoordinate(lng, lat)) {
      console.warn('Invalid coordinates for circle:', lng, lat);
      return;
    }

    const circleId = `circle-${index}`;
    const circleData = createGeoJSONCircle([lng, lat], radiusInKm);

    // Check if the source already exists
    if (mapRef.current.getSource(circleId)) {
      // Update existing circle
      (mapRef.current.getSource(circleId) as mapboxgl.GeoJSONSource).setData(
        circleData
      );
    } else {
      // Create new circle source and layers
      try {
        // Add the GeoJSON source
        mapRef.current.addSource(circleId, {
          type: 'geojson',
          data: circleData,
        });

        // Add the fill layer
        mapRef.current.addLayer({
          id: circleId,
          type: 'fill',
          source: circleId,
          paint: {
            'fill-color':
              index === selectedLocationIndex ? '#3b82f6' : '#ff0000',
            'fill-opacity': 0.2,
          },
        });

        // Add the outline layer
        mapRef.current.addLayer({
          id: `${circleId}-border`,
          type: 'line',
          source: circleId,
          paint: {
            'line-color':
              index === selectedLocationIndex ? '#3b82f6' : '#ff0000',
            'line-width': 2,
          },
        });

        // Store the circle source reference
        circlesRef.current.set(
          index,
          mapRef.current.getSource(circleId) as mapboxgl.GeoJSONSource
        );
      } catch (error) {
        console.error('Error adding circle to map:', error);
      }
    }
  }

  // Function to create a draggable marker
  function createDraggableMarker(lngLat: [number, number], index: number) {
    if (!mapRef.current) return null;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.setAttribute('data-index', index.toString());

    // Add marker numbering for multiple points
    if (currentLocationAnswersRef.current.length > 1) {
      el.style.backgroundColor = getMarkerColor(index);
      el.innerHTML = `<span style="color: white; font-size: 12px; font-weight: bold;">${index + 1
        }</span>`;
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
    }

    const marker = new mapboxgl.Marker({
      element: el,
      draggable: !readonly,
    })
      .setLngLat(lngLat)
      .addTo(mapRef.current);

    if (!readonly) {
      // Add event handlers for dragging
      marker.on('dragstart', () => {
        console.log(`🎯 Started dragging marker ${index + 1}`);

        // **NEW**: Set comprehensive drag state
        setIsDragging(true);
        setDraggedMarkerIndex(index);
        el.classList.add('dragging');

        // **CRITICAL**: Set drag operation ref to prevent interference
        dragOperationRef.current = {
          isDragging: true,
          markerIndex: index,
          timestamp: Date.now(),
        };

        // **NEW**: Also set ignore flag to prevent any updates during drag
        ignoreNextUpdateRef.current = true;
      });

      marker.on('drag', () => {
        const newLngLat = marker.getLngLat();

        // **NEW**: Store the latest position during drag
        latestMarkerPositionsRef.current.set(index, {
          lng: newLngLat.lng,
          lat: newLngLat.lat,
        });

        // Update the circle in real-time while dragging
        const currentRadius =
          currentLocationAnswersRef.current[index]?.radius || 10;
        updateCircle(index, newLngLat.lat, newLngLat.lng, currentRadius);

        // **NEW**: Update drag operation with new position
        if (dragOperationRef.current) {
          dragOperationRef.current.newPosition = {
            lng: newLngLat.lng,
            lat: newLngLat.lat,
          };
        }
      });

      marker.on('dragend', () => {
        const newLngLat = marker.getLngLat();

        console.log(
          `🎯 Drag ended for marker ${index + 1} at: ${newLngLat.lng.toFixed(
            6
          )}, ${newLngLat.lat.toFixed(6)}`
        );

        // Store final position immediately
        latestMarkerPositionsRef.current.set(index, {
          lng: newLngLat.lng,
          lat: newLngLat.lat,
        });

        // Update local state with final position
        const updatedLocations = [...currentLocationAnswersRef.current];
        if (updatedLocations[index]) {
          updatedLocations[index] = {
            ...updatedLocations[index],
            longitude: newLngLat.lng,
            latitude: newLngLat.lat,
          };

          // Update refs immediately before any async operations
          currentLocationAnswersRef.current = updatedLocations;
          setLocationData(updatedLocations);

          // Create a specific event for drag end operations
          if (typeof window !== 'undefined') {
            // Update timestamp with specific source to identify drag operations
            window.lastLocationUpdate = {
              timestamp: Date.now(),
              activityId: questionIndex.toString(),
              locationData: [...updatedLocations],
              source: `location-editor-dragend-marker-${index}`,
            };

            // Dispatch custom event to trigger API update for location change
            const dragEndEvent = new CustomEvent('location:marker:dragend', {
              detail: {
                questionIndex: questionIndex,
                locationData: updatedLocations,
                markerIndex: index,
                timestamp: Date.now(),
              },
            });
            window.dispatchEvent(dragEndEvent);
          }

          // IMPORTANT: Call parent's change handler immediately with no debounce for drag end
          // This ensures API gets updated immediately after drag
          onLocationChange(questionIndex, updatedLocations);

          // Show toast notification

        }

        // Clean up drag state with delay to ensure API call completes
        setTimeout(() => {
          setIsDragging(false);
          setDraggedMarkerIndex(-1);
          el.classList.remove('dragging');

          // Clear drag operation ref
          dragOperationRef.current = null;
        }, 100);
      });

      // Click handler for selection
      el.addEventListener('click', () => {
        setSelectedLocationIndex(selectedLocationIndex === index ? -1 : index);

        // Update marker styling
        document.querySelectorAll('.custom-marker').forEach((m) => {
          m.classList.remove('selected');
        });

        if (selectedLocationIndex !== index) {
          el.classList.add('selected');
        }
      });
    }

    return marker;
  }

  // Helper function to get unique colors for multiple markers
  function getMarkerColor(index: number): string {
    const colors = [
      '#ff0000', // Red
      '#0088ff', // Blue
      '#00ff00', // Green
      '#ff8800', // Orange
      '#8800ff', // Purple
      '#00ffff', // Cyan
      '#ff00ff', // Magenta
      '#ffff00', // Yellow
    ];
    return colors[index % colors.length];
  }

  // Function to fit map to show all markers
  const fitMapToMarkers = () => {
    if (!mapRef.current || currentLocationAnswersRef.current.length === 0)
      return;

    // Filter out invalid coordinates
    const validLocations = currentLocationAnswersRef.current.filter((loc) =>
      isValidCoordinate(loc.longitude, loc.latitude)
    );

    if (validLocations.length === 0) return;

    // Create a bounds object
    const bounds = new mapboxgl.LngLatBounds();

    // Extend the bounds to include each marker
    validLocations.forEach((loc) => {
      bounds.extend([loc.longitude, loc.latitude]);
    });

    // Fit the map to the bounds with some padding
    mapRef.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14,
      duration: 1000, // Smooth animation
    });

    // Show a brief toast message

  };

  // Refresh all markers on the map using specified data
  function refreshMapMarkersWithData(locData: LocationAnswer[]) {
    if (!mapRef.current || !mapLoaded || isDragging) return;

    // **CRITICAL**: Don't refresh if we're in the middle of a drag operation
    if (dragOperationRef.current?.isDragging) {
      console.log('⚠️ Skipping marker refresh during drag operation');
      return;
    }

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
      // **NEW**: Check for latest dragged position first
      const latestPosition = latestMarkerPositionsRef.current.get(index);
      let finalLng = location.longitude;
      let finalLat = location.latitude;

      // **CRITICAL**: Use latest drag position if available and significantly different
      if (latestPosition) {
        const positionDiff =
          Math.abs(latestPosition.lng - location.longitude) +
          Math.abs(latestPosition.lat - location.latitude);

        if (positionDiff > 0.000001) {
          console.log(
            `🎯 Using latest drag position for marker ${index + 1
            }: ${latestPosition.lng.toFixed(6)}, ${latestPosition.lat.toFixed(
              6
            )}`
          );
          finalLng = latestPosition.lng;
          finalLat = latestPosition.lat;

          // **NEW**: Update location data with drag position
          location = {
            ...location,
            longitude: finalLng,
            latitude: finalLat,
          };
        }
      }

      // Skip invalid coordinates
      if (!isValidCoordinate(finalLng, finalLat)) {
        console.warn('Skipping invalid coordinates', location);
        return;
      }

      const lngLat = [finalLng, finalLat] as [number, number];

      // Create a draggable marker
      const marker = createDraggableMarker(lngLat, index);

      // Store marker reference only if marker was created successfully
      if (marker) {
        markersRef.current.set(index, marker);
      }

      // Update the circle for this location
      updateCircle(index, finalLat, finalLng, location.radius || 10);
    });

    // If we have at least one location, fit the map to show all markers
    if (locData.length > 0 && mapRef.current) {
      // Filter out invalid coordinates and use latest positions
      const validLocations = locData
        .map((loc, index) => {
          const latestPosition = latestMarkerPositionsRef.current.get(index);
          if (
            latestPosition &&
            isValidCoordinate(latestPosition.lng, latestPosition.lat)
          ) {
            return {
              ...loc,
              longitude: latestPosition.lng,
              latitude: latestPosition.lat,
            };
          }
          return loc;
        })
        .filter((loc) => isValidCoordinate(loc.longitude, loc.latitude));

      if (validLocations.length > 0) {
        // Create a bounds object
        const bounds = new mapboxgl.LngLatBounds();

        // Extend the bounds to include each valid location
        validLocations.forEach((loc) => {
          bounds.extend([loc.longitude, loc.latitude]);
        });

        // Set the map's bounds with some padding
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 12,
        });
      }
    }
  }

  // Refresh all markers on the map using prop data
  function refreshMapMarkers(dataOverride?: LocationAnswer[]) {
    // Use dataOverride if provided, otherwise use locationData state if available, falling back to locationAnswers prop
    const dataToUse =
      dataOverride ||
      (locationData.length > 0 ? locationData : locationAnswers);
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
    if (typeof window !== 'undefined') {
      // Clear any existing timeout
      if (window.locationUpdateTimer) {
        clearTimeout(window.locationUpdateTimer);
      }

      // Set a new timeout with longer debounce to prevent spam
      window.locationUpdateTimer = setTimeout(() => {
        // Check if this update is different from what we already have
        const lastUpdate = window.lastLocationUpdate;
        const currentTime = Date.now();

        // Skip if we just sent an update recently (within 2 seconds)
        if (
          lastUpdate &&
          lastUpdate.activityId === questionIndex.toString() &&
          currentTime - lastUpdate.timestamp < 2000
        ) {
          console.log('[DEBUG] Skipping API call - too recent');
          return;
        }

        // Check if data actually changed
        if (
          lastUpdate &&
          JSON.stringify(lastUpdate.locationData) ===
          JSON.stringify(newLocationData)
        ) {
          console.log('[DEBUG] Skipping API call - no data change');
          return;
        }

        console.log('[DEBUG] Making API call for location update');

        // Update last update timestamp immediately to prevent race conditions
        window.lastLocationUpdate = {
          timestamp: currentTime,
          activityId: questionIndex.toString(),
          locationData: [...newLocationData],
          source: 'location-editor',
        };

        // Call the parent's change handler
        onLocationChange(questionIndex, newLocationData);
      }, 1500); // Increased debounce to 1.5 seconds
    }
  };

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Clean up search timeout as well
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showSearchResults && !target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  // Handle click outside to close context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close context menu when clicking outside, but not if clicking on the menu itself
      if (contextMenu?.visible) {
        const target = event.target as Element;
        const contextMenuElement = target.closest('.context-menu');

        if (!contextMenuElement) {
          setContextMenu(null);
        }
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]);

  // Search functionality using Mapbox Geocoding API
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxgl.accessToken
        }&types=place,locality,neighborhood,address,poi&limit=5&country=vn`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 500);
  };

  // Handle selecting a search result
  const handleSelectPlace = (place: any) => {
    if (!mapRef.current || !place.geometry?.coordinates) return;

    const [lng, lat] = place.geometry.coordinates;

    // Fly to the selected location
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 1500,
      essential: true,
    });

    // Clear search results
    setShowSearchResults(false);
    setSearchQuery(place.place_name);

  };

  // Modify the handleAddLocationAtPlace function to properly initialize the new point
  const handleAddLocationAtPlace = (place: any) => {
    if (!place.geometry?.coordinates || readonly) return;

    const [lng, lat] = place.geometry.coordinates;

    // Create new location
    const newLocation: LocationAnswer = {
      longitude: lng,
      latitude: lat,
      radius: 10,
    };

    // Add to current locations
    const updatedLocations = [
      ...currentLocationAnswersRef.current,
      newLocation,
    ];

    // Calculate the new index for this location
    const newPointIndex = updatedLocations.length - 1;

    // Update refs and state
    currentLocationAnswersRef.current = updatedLocations;
    setLocationData(updatedLocations);

    // IMPORTANT: Add this new point to latestMarkerPositionsRef so it's tracked for drag operations
    latestMarkerPositionsRef.current.set(newPointIndex, {
      lng: lng,
      lat: lat,
    });

    // Update global state to prevent conflicts
    if (typeof window !== 'undefined') {
      window.lastLocationUpdate = {
        timestamp: Date.now(),
        activityId: questionIndex.toString(),
        locationData: updatedLocations,
        source: 'location-editor-add-point',
      };
    }

    // Call parent handler to update the API immediately
    onLocationChange(questionIndex, updatedLocations);

    // Refresh map markers to include the new point with proper event handlers
    setTimeout(() => {
      refreshMapMarkersWithData(updatedLocations);

      // Set as selected
      setSelectedLocationIndex(newPointIndex);

      // Fly to the new location
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 1500,
          essential: true,
        });
      }
    }, 100);

    // Clear search
    setShowSearchResults(false);
    setSearchQuery('');

  };

  // Handle creating a new location point from context menu
  const handleCreatePointAtPosition = (lng: number, lat: number) => {
    console.log('🎯 Creating point at position:', lng, lat);

    if (readonly) {
      console.log('❌ Cannot create point - readonly mode');
      return;
    }

    // Create new location
    const newLocation: LocationAnswer = {
      longitude: lng,
      latitude: lat,
      radius: 10,
    };

    console.log('📍 New location object:', newLocation);

    // Add to current locations
    const updatedLocations = [
      ...currentLocationAnswersRef.current,
      newLocation,
    ];

    console.log('📋 Updated locations array:', updatedLocations);

    // Calculate the new index for this location
    const newPointIndex = updatedLocations.length - 1;

    // Update refs and state
    currentLocationAnswersRef.current = updatedLocations;
    setLocationData(updatedLocations);

    // Add this new point to latestMarkerPositionsRef so it's tracked for drag operations
    latestMarkerPositionsRef.current.set(newPointIndex, {
      lng: lng,
      lat: lat,
    });

    // Update global state to prevent conflicts
    if (typeof window !== 'undefined') {
      window.lastLocationUpdate = {
        timestamp: Date.now(),
        activityId: questionIndex.toString(),
        locationData: updatedLocations,
        source: 'location-editor-context-menu',
      };
    }

    // Call parent handler to update the API immediately
    onLocationChange(questionIndex, updatedLocations);

    // Refresh map markers to include the new point with proper event handlers
    setTimeout(() => {
      refreshMapMarkersWithData(updatedLocations);

      // Set as selected
      setSelectedLocationIndex(newPointIndex);

      // Optionally fly to the new location
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 1000,
          essential: true,
        });
      }
    }, 100);

    // Hide context menu
    setContextMenu(null);

    // Show success toast
    toast({
      description: `Đã thêm điểm mới tại vị trí (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
      duration: 3000,
    });
  };

  // Add this helper function to the component
  const initializeMarkers = (locationData: any[]) => {
    if (!locationData || locationData.length === 0) return;

    const newMarkers = locationData.map((location) => ({
      longitude: location.longitude,
      latitude: location.latitude,
      radius: location.radius || 10,
      quizLocationAnswerId: location.quizLocationAnswerId || '',
    }));

    setMarkers(newMarkers);

    // If map is available, fit bounds to show all markers
    if (mapRef.current) {
      const bounds = new mapboxgl.LngLatBounds();

      newMarkers.forEach((marker) => {
        bounds.extend([marker.longitude, marker.latitude]);
      });

      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          duration: 1000,
        });
      }
    }
  };

  useEffect(() => {
    if (
      !isDragging &&
      locationAnswers &&
      locationAnswers.length !== currentLocationAnswersRef.current.length
    ) {
      console.log(
        'Location answers changed, forcing map refresh:',
        locationAnswers
      );
      setLocationData(locationAnswers);
      currentLocationAnswersRef.current = [...locationAnswers];
      if (mapLoaded && mapRef.current) {
        refreshMapMarkersWithData(locationAnswers);
      }
    }
  }, [locationAnswers, isDragging, mapLoaded]);

  return (
    <div className="w-full relative">
      <Card className="shadow-md border-0">
        <CardHeader className="pb-3">
          <div className="relative search-container">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for places... (e.g., Hanoi, Ho Chi Minh City)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4"
                disabled={readonly}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.map((place, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleSelectPlace(place)}
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {place.text}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {place.place_name}
                            </div>
                          </div>
                        </div>
                      </div>

                      {!readonly && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddLocationAtPlace(place);
                          }}
                          title="Add location point here"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div
            ref={mapContainerRef}
            className="w-full rounded-md overflow-hidden"
            style={{ height: '400px' }}
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

      {/* Context Menu */}
      {contextMenu?.visible && (
        <div
          className="context-menu fixed bg-white border border-gray-200 rounded-md shadow-lg z-[9999] py-1 min-w-[200px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={(e) => {
              console.log('🔘 Context menu button clicked');
              e.stopPropagation();
              e.preventDefault();
              handleCreatePointAtPosition(contextMenu.lng, contextMenu.lat);
            }}
          >
            <Plus className="h-4 w-4 text-red-500" />
            Tạo điểm tại vị trí này
          </button>
        </div>
      )}
    </div>
  );
}
