"use client";

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Search, Maximize, Globe, Layers, Map as MapIcon, Compass, Mountain, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Feature, Polygon } from 'geojson';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Set your Mapbox access token - trong môi trường thực tế nên sử dụng biến môi trường
mapboxgl.accessToken = "pk.eyJ1IjoiY2NkY2MxMSIsImEiOiJjbWFnbXduZDkwMmV6MnFzbDIxM3dxMTJ4In0.2-eYJyMMthGbAa9SOtCDbQ";

// Define map styles
const MAP_STYLES = {
  STREETS: { id: 'streets', name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12', icon: <MapIcon className="h-4 w-4 mr-2" /> },
  SATELLITE: { id: 'satellite', name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-v9', icon: <Globe className="h-4 w-4 mr-2" /> },
  SATELLITE_STREETS: { id: 'satellite-streets', name: 'Satellite Streets', url: 'mapbox://styles/mapbox/satellite-streets-v12', icon: <Layers className="h-4 w-4 mr-2" /> },
  OUTDOORS: { id: 'outdoors', name: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12', icon: <Mountain className="h-4 w-4 mr-2" /> },
  NAVIGATION_DAY: { id: 'navigation-day', name: 'Navigation Day', url: 'mapbox://styles/mapbox/navigation-day-v1', icon: <Compass className="h-4 w-4 mr-2" /> },
  NAVIGATION_NIGHT: { id: 'navigation-night', name: 'Navigation Night', url: 'mapbox://styles/mapbox/navigation-night-v1', icon: <Compass className="h-4 w-4 mr-2" /> },
};

interface LocationQuestionEditorProps {
  questionText: string;
  locationData: {
    lat: number;
    lng: number;
    radius: number;
    hint?: string;
  };
  onLocationChange: (location: { lat: number; lng: number; radius: number; hint?: string }) => void;
  readonly?: boolean;
  mapStyle?: string;
  use3D?: boolean;
  useGlobe?: boolean;
}

export function LocationQuestionEditor({
  questionText,
  locationData = { lat: 21.028511, lng: 105.804817, radius: 10, hint: "" }, // Default to Hanoi
  onLocationChange,
  readonly = false,
  mapStyle = MAP_STYLES.OUTDOORS.url,
  use3D = false,
  useGlobe = false
}: LocationQuestionEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const circleRef = useRef<mapboxgl.GeoJSONSource | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [isGlobeMode, setIsGlobeMode] = useState(useGlobe); // Use prop value
  const [is3DMode, setIs3DMode] = useState(use3D); // Use prop value
  const [currentStyle, setCurrentStyle] = useState(MAP_STYLES.OUTDOORS); // Default to outdoors
  const { toast } = useToast();
  const [isBrowser, setIsBrowser] = useState(false);

  // Check if we're in a browser environment
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // When props change, update our internal state
  useEffect(() => {
    setIsGlobeMode(useGlobe);
    setIs3DMode(use3D);

    // Find the matching style from MAP_STYLES or use OUTDOORS as default
    const styleObj = Object.values(MAP_STYLES).find(s => s.url === mapStyle) || MAP_STYLES.OUTDOORS;
    setCurrentStyle(styleObj);
  }, [mapStyle, use3D, useGlobe]);

  // Thêm style động
  useEffect(() => {
    if (!isBrowser) return;

    // Thêm style cho custom marker và các hiệu ứng khác
    const style = document.createElement('style');
    style.innerHTML = `
      .mapboxgl-canvas {
        filter: drop-shadow(0px 0px 15px rgba(0, 60, 255, 0.3));
      }
      
      .mapboxgl-ctrl-attrib-inner {
        opacity: 0.5;
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
      
      .marker-pulse {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 0, 0, 0.4);
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          transform: scale(0.8);
          opacity: 0.8;
        }
        70% {
          transform: scale(2);
          opacity: 0;
        }
        100% {
          transform: scale(0.8);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [isBrowser]);

  useEffect(() => {
    if (!isBrowser || !mapContainerRef.current) return;

    // Đánh dấu container khi sử dụng chế độ globe
    if (isGlobeMode) {
      mapContainerRef.current.classList.add('globe-mode');
    }

    // Tạo đối tượng map Mapbox với projection globe
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: currentStyle.url, // Use current style
      center: [0, 20], // Bắt đầu với góc nhìn quả cầu
      zoom: 1.5,
      pitch: is3DMode ? 45 : 0,
      bearing: is3DMode ? 15 : 0,
      projection: isGlobeMode ? 'globe' : 'mercator', // Sử dụng projection globe để hiển thị dạng quả cầu
      antialias: true,
    });

    mapRef.current = map;

    // Thêm các controls vào map
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Thêm hiệu ứng khi map đang tải
    map.on('style.load', () => {
      // Only add these effects if 3D mode is active
      if (is3DMode) {
        try {
          // Thêm khí quyển
          map.setFog({
            'color': 'rgb(186, 210, 235)',
            'high-color': 'rgb(36, 92, 223)',
            'horizon-blend': 0.1,
            'space-color': 'rgb(11, 11, 25)',
            'star-intensity': 0.6
          });

          // Thêm hiệu ứng bầu trời
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
          console.error("Error adding effects:", error);
        }
      }
    });

    map.on("load", () => {
      setMapLoaded(true);

      try {
        // Thêm nguồn dữ liệu địa hình 3D if 3D mode is active
        if (is3DMode) {
          map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });

          // Thêm địa hình 3D
          map.setTerrain({
            'source': 'mapbox-dem',
            'exaggeration': 1.5
          });
        }

        // Thêm animation xoay quả cầu nhẹ nhàng nếu ở chế độ globe
        if (isGlobeMode && !readonly) {
          const rotateCamera = () => {
            if (mapRef.current && isGlobeMode) {
              map.easeTo({
                bearing: map.getBearing() + 0.1,
                duration: 50,
                easing: t => t
              });
              requestAnimationFrame(rotateCamera);
            }
          };

          // Bắt đầu animation sau một khoảng thời gian
          const rotationTimer = setTimeout(() => {
            rotateCamera();
          }, 5000);

          // Dừng animation khi có tương tác
          const stopRotation = () => {
            clearTimeout(rotationTimer);
          };

          map.on('mousedown', stopRotation);
          map.on('touchstart', stopRotation);
        }

        // Thêm một source cho vòng tròn bán kính
        map.addSource("radius-circle", {
          type: "geojson",
          data: createGeoJSONCircle([locationData.lng, locationData.lat], locationData.radius)
        });

        // Thêm layer để hiển thị vòng tròn
        map.addLayer({
          id: "radius-circle-fill",
          type: "fill",
          source: "radius-circle",
          paint: {
            "fill-color": "#4264fb",
            "fill-opacity": 0.15,
          }
        });

        map.addLayer({
          id: "radius-circle-outline",
          type: "line",
          source: "radius-circle",
          paint: {
            "line-color": "#4264fb",
            "line-width": 2,
            "line-blur": 1,
            "line-opacity": 0.8
          }
        });

        circleRef.current = map.getSource("radius-circle") as mapboxgl.GeoJSONSource;

        // Tạo custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';

        // Thêm hiệu ứng pulse
        const pulse = document.createElement('div');
        pulse.className = 'marker-pulse';
        el.appendChild(pulse);

        // Tạo marker
        const marker = new mapboxgl.Marker({
          element: el,
          draggable: !readonly
        })
          .setLngLat([locationData.lng, locationData.lat])
          .addTo(map);

        markerRef.current = marker;

        if (!readonly) {
          // Cập nhật vị trí khi marker được kéo
          marker.on("dragend", () => {
            const lngLat = marker.getLngLat();
            updateLocation(lngLat.lat, lngLat.lng, locationData.radius, locationData.hint);
          });
        }
      } catch (error) {
        console.error("Error initializing map components:", error);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locationData.lat, locationData.lng, locationData.radius, readonly, isGlobeMode, is3DMode, currentStyle, isBrowser]);

  // Hàm tạo GeoJSON circle
  function createGeoJSONCircle(center: [number, number], radiusInKm: number, points: number = 64): Feature<Polygon> {
    const coords = {
      latitude: center[1],
      longitude: center[0]
    };

    const km = radiusInKm;
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
    ret.push(ret[0]); // Đóng vòng tròn

    return {
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [ret]
      },
      properties: {}
    };
  }

  // Cập nhật vòng tròn trên bản đồ
  function updateCircle(center: [number, number], radius: number) {
    if (circleRef.current) {
      circleRef.current.setData(createGeoJSONCircle(center, radius));
    }
  }

  // Hàm cập nhật vị trí
  const updateLocation = (lat: number, lng: number, radius: number, hint?: string) => {
    // Cập nhật marker position
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }

    // Cập nhật vòng tròn
    updateCircle([lng, lat], radius);

    // Gọi callback để thông báo thay đổi
    onLocationChange({ lat, lng, radius, hint });
  };

  // Xử lý thay đổi bán kính
  const handleRadiusChange = (value: number[]) => {
    const radius = value[0];
    updateLocation(locationData.lat, locationData.lng, radius, locationData.hint);
  };

  // Xử lý tìm kiếm
  const handleSearch = async () => {
    if (!locationSearch.trim() || !mapRef.current) return;

    try {
      // Gọi Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          locationSearch
        )}.json?access_token=${mapboxgl.accessToken}&limit=1`
      );

      if (!response.ok) {
        throw new Error("Geocoding request failed");
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;

        // Cập nhật marker và vòng tròn
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        }

        // Cập nhật location data
        updateLocation(lat, lng, locationData.radius, locationData.hint);

        // Zoom đến vị trí
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 14,
          essential: true
        });

        // Reset search field
        setLocationSearch("");

        toast({
          title: "Location found",
          description: data.features[0].place_name,
        });
      } else {
        toast({
          title: "Location not found",
          description: "Try a different search term",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching location:", error);
      toast({
        title: "Search error",
        description: "Could not search for location",
        variant: "destructive",
      });
    }
  };

  // Xử lý thay đổi gợi ý
  const handleHintChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLocation(locationData.lat, locationData.lng, locationData.radius, e.target.value);
  };

  // Xử lý thay đổi lat
  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      updateLocation(value, locationData.lng, locationData.radius, locationData.hint);
    }
  };

  // Xử lý thay đổi lng
  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      updateLocation(locationData.lat, value, locationData.radius, locationData.hint);
    }
  };

  // Function to handle changing map style
  const changeMapStyle = (style: typeof MAP_STYLES.STREETS) => {
    setCurrentStyle(style);
    if (mapRef.current) {
      mapRef.current.setStyle(style.url);

      // Re-add terrain if 3D mode is active
      if (is3DMode) {
        mapRef.current.once('style.load', () => {
          // Re-add 3D terrain
          if (mapRef.current) {
            mapRef.current.addSource('mapbox-dem', {
              'type': 'raster-dem',
              'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
              'tileSize': 512,
              'maxzoom': 14
            });

            mapRef.current.setTerrain({
              'source': 'mapbox-dem',
              'exaggeration': 1.5
            });

            // Re-add atmosphere and sky for 3D effect
            mapRef.current.setFog({
              'color': 'rgb(186, 210, 235)',
              'high-color': 'rgb(36, 92, 223)',
              'horizon-blend': 0.1,
              'space-color': 'rgb(11, 11, 25)',
              'star-intensity': 0.6
            });

            mapRef.current.addLayer({
              'id': 'sky',
              'type': 'sky',
              'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 90.0],
                'sky-atmosphere-sun-intensity': 15
              }
            });
          }
        });
      }
    }
  };

  // Function to toggle between 2D and 3D modes
  const toggle3DMode = () => {
    const newMode = !is3DMode;
    setIs3DMode(newMode);

    if (mapRef.current) {
      if (newMode) {
        // Check if style is loaded before proceeding
        if (!mapRef.current.isStyleLoaded()) {
          // If style is not loaded, wait for style.load event
          mapRef.current.once('style.load', () => {
            // Enable 3D terrain after style loads
            if (mapRef.current && !mapRef.current.getSource('mapbox-dem')) {
              try {
                mapRef.current.addSource('mapbox-dem', {
                  'type': 'raster-dem',
                  'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                  'tileSize': 512,
                  'maxzoom': 14
                });

                mapRef.current.setTerrain({
                  'source': 'mapbox-dem',
                  'exaggeration': 1.5
                });

                // Add atmosphere and sky for 3D effect
                mapRef.current.setFog({
                  'color': 'rgb(186, 210, 235)',
                  'high-color': 'rgb(36, 92, 223)',
                  'horizon-blend': 0.1,
                  'space-color': 'rgb(11, 11, 25)',
                  'star-intensity': 0.6
                });

                // Adjust camera angle for 3D
                mapRef.current.setPitch(45);
                mapRef.current.setBearing(15);
              } catch (error) {
                console.error("Error adding 3D terrain:", error);
              }
            }
          });
        } else {
          // Style is already loaded, proceed immediately
          if (!mapRef.current.getSource('mapbox-dem')) {
            try {
              mapRef.current.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
              });

              mapRef.current.setTerrain({
                'source': 'mapbox-dem',
                'exaggeration': 1.5
              });

              // Add atmosphere and sky for 3D effect
              mapRef.current.setFog({
                'color': 'rgb(186, 210, 235)',
                'high-color': 'rgb(36, 92, 223)',
                'horizon-blend': 0.1,
                'space-color': 'rgb(11, 11, 25)',
                'star-intensity': 0.6
              });

              // Adjust camera angle for 3D
              mapRef.current.setPitch(45);
              mapRef.current.setBearing(15);
            } catch (error) {
              console.error("Error adding 3D terrain:", error);
            }
          }
        }
      } else {
        // Disable 3D terrain - these operations are safe even if style isn't loaded
        try {
          mapRef.current.setTerrain(null);
          mapRef.current.setFog(null);

          // Check if style is loaded before removing layers
          if (mapRef.current.isStyleLoaded() && mapRef.current.getLayer('sky')) {
            mapRef.current.removeLayer('sky');
          }

          // Reset to flat view
          mapRef.current.setPitch(0);
          mapRef.current.setBearing(0);
        } catch (error) {
          console.error("Error disabling 3D terrain:", error);
        }
      }
    }
  };

  // Function to toggle globe projection
  const toggleGlobeMode = () => {
    const newMode = !isGlobeMode;
    setIsGlobeMode(newMode);

    // Reload the map with new projection
    if (mapRef.current) {
      try {
        const center = mapRef.current.getCenter();
        const zoom = mapRef.current.getZoom();
        const pitch = mapRef.current.getPitch();
        const bearing = mapRef.current.getBearing();

        mapRef.current.remove();

        // Update container class
        if (mapContainerRef.current) {
          if (newMode) {
            mapContainerRef.current.classList.add('globe-mode');
          } else {
            mapContainerRef.current.classList.remove('globe-mode');
          }
        }

        // Create new map with selected projection
        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: currentStyle.url,
          center: center,
          zoom: zoom,
          pitch: pitch,
          bearing: bearing,
          projection: newMode ? 'globe' : 'mercator',
          antialias: true,
        });

        mapRef.current = map;

        // Reinitialize map when loaded
        map.on('load', () => {
          setMapLoaded(true);

          // Re-add controls
          map.addControl(new mapboxgl.NavigationControl(), "top-right");

          try {
            // Wait until style is fully loaded
            setTimeout(() => {
              try {
                // Re-add 3D terrain if enabled
                if (is3DMode && mapRef.current) {
                  mapRef.current.addSource('mapbox-dem', {
                    'type': 'raster-dem',
                    'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                    'tileSize': 512,
                    'maxzoom': 14
                  });

                  mapRef.current.setTerrain({
                    'source': 'mapbox-dem',
                    'exaggeration': 1.5
                  });

                  // Add atmosphere and sky for 3D effect
                  mapRef.current.setFog({
                    'color': 'rgb(186, 210, 235)',
                    'high-color': 'rgb(36, 92, 223)',
                    'horizon-blend': 0.1,
                    'space-color': 'rgb(11, 11, 25)',
                    'star-intensity': 0.6
                  });

                  mapRef.current.addLayer({
                    'id': 'sky',
                    'type': 'sky',
                    'paint': {
                      'sky-type': 'atmosphere',
                      'sky-atmosphere-sun': [0.0, 90.0],
                      'sky-atmosphere-sun-intensity': 15
                    }
                  });
                }

                // Re-add circle source and layer
                if (mapRef.current) {
                  mapRef.current.addSource("radius-circle", {
                    type: "geojson",
                    data: createGeoJSONCircle([locationData.lng, locationData.lat], locationData.radius)
                  });

                  mapRef.current.addLayer({
                    id: "radius-circle-fill",
                    type: "fill",
                    source: "radius-circle",
                    paint: {
                      "fill-color": "#4264fb",
                      "fill-opacity": 0.15,
                    }
                  });

                  mapRef.current.addLayer({
                    id: "radius-circle-outline",
                    type: "line",
                    source: "radius-circle",
                    paint: {
                      "line-color": "#4264fb",
                      "line-width": 2,
                      "line-blur": 1,
                      "line-opacity": 0.8
                    }
                  });

                  circleRef.current = mapRef.current.getSource("radius-circle") as mapboxgl.GeoJSONSource;

                  // Re-add marker
                  const el = document.createElement('div');
                  el.className = 'custom-marker';

                  const pulse = document.createElement('div');
                  pulse.className = 'marker-pulse';
                  el.appendChild(pulse);

                  const marker = new mapboxgl.Marker({
                    element: el,
                    draggable: !readonly
                  })
                    .setLngLat([locationData.lng, locationData.lat])
                    .addTo(mapRef.current);

                  markerRef.current = marker;

                  if (!readonly) {
                    marker.on("dragend", () => {
                      const lngLat = marker.getLngLat();
                      updateLocation(lngLat.lat, lngLat.lng, locationData.radius, locationData.hint);
                    });
                  }
                }
              } catch (error) {
                console.error("Error in delayed map initialization:", error);
              }
            }, 1000); // Delay to ensure the style is fully loaded
          } catch (error) {
            console.error("Error reinitializing map:", error);
          }
        });
      } catch (error) {
        console.error("Error toggling globe mode:", error);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-medium text-center mb-2">
          {questionText || "Chọn vị trí trên bản đồ"}
        </h3>

        {/* Control toolbar */}
        {!readonly && (
          <div className="absolute top-2 left-2 z-10 bg-white dark:bg-gray-900 rounded-md shadow-md p-1.5 flex flex-col gap-1.5">
            {/* Map style selector */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="flex items-center justify-center gap-1">
                        <Layers className="h-4 w-4" />
                        <span className="text-xs">Map Style</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {Object.values(MAP_STYLES).map((style) => (
                        <DropdownMenuItem
                          key={style.id}
                          onClick={() => changeMapStyle(style)}
                          className={`flex items-center ${currentStyle.id === style.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                        >
                          {style.icon}
                          <span>{style.name}</span>
                          {currentStyle.id === style.id && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Change map style</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* View mode buttons */}
            <div className="flex flex-col gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={isGlobeMode ? "default" : "outline"}
                      onClick={toggleGlobeMode}
                      className="w-full"
                    >
                      <Globe className="h-4 w-4 mr-1" /> Globe
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle globe view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={is3DMode ? "default" : "outline"}
                      onClick={toggle3DMode}
                      className="w-full"
                    >
                      <Mountain className="h-4 w-4 mr-1" /> 3D Terrain
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle 3D terrain</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Search box */}
            <div className="mt-1">
              <div className="flex items-center">
                <Input
                  placeholder="Search location..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSearch}
                  className="h-8 px-2"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Map container */}
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden"
            style={{
              boxShadow: isGlobeMode ? '0 0 25px rgba(0, 30, 255, 0.2)' : 'none',
              borderRadius: '12px'
            }}
          />
        </div>

        {/* Coordinates display */}
        <div className="bg-muted/30 p-3 rounded-md text-sm text-center">
          <p>Tọa độ: {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}</p>
          <p className="text-muted-foreground text-xs">
            {locationSearch ? `Đang hiển thị: ${locationSearch}` : "Kéo ghim đỏ để điều chỉnh vị trí"}
          </p>
        </div>

        {!readonly && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={locationData.lat}
                  onChange={handleLatChange}
                  placeholder="Latitude"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={locationData.lng}
                  onChange={handleLngChange}
                  placeholder="Longitude"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="hint">Gợi ý cho người chơi:</Label>
              </div>
              <Input
                id="hint"
                placeholder="Ví dụ: Thủ đô của Việt Nam"
                value={locationData.hint || ""}
                onChange={handleHintChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="radius">Bán kính chấp nhận: {locationData.radius} km</Label>
              </div>
              <Slider
                id="radius"
                min={1}
                max={100}
                step={1}
                value={[locationData.radius]}
                onValueChange={handleRadiusChange}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Người dùng sẽ nhận được điểm nếu chọn vị trí trong phạm vi bán kính này
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}