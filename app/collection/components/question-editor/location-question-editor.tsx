"use client";

import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Search, Maximize, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Feature, Polygon } from 'geojson';

// Set your Mapbox access token - trong môi trường thực tế nên sử dụng biến môi trường
mapboxgl.accessToken = "pk.eyJ1IjoiY2NkY2MxMSIsImEiOiJjbWFjbDZzZm8wNGpxMmpxMDViM3R6ZHEwIn0.1LP9P6Cdjfk34GNI5_fGoA";

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
}

export function LocationQuestionEditor({
  questionText,
  locationData = { lat: 21.028511, lng: 105.804817, radius: 10, hint: "" }, // Default to Hanoi
  onLocationChange,
  readonly = false
}: LocationQuestionEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const circleRef = useRef<mapboxgl.GeoJSONSource | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [isGlobeMode, setIsGlobeMode] = useState(true); // Bắt đầu với chế độ globe
  const { toast } = useToast();

  // Thêm style động
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Đánh dấu container khi sử dụng chế độ globe
    if (isGlobeMode) {
      mapContainerRef.current.classList.add('globe-mode');
    }

    // Tạo đối tượng map Mapbox với projection globe
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12", // Style kết hợp vệ tinh với đường phố
      center: [0, 20], // Bắt đầu với góc nhìn quả cầu
      zoom: 1.5,
      pitch: 45,
      bearing: 15,
      projection: isGlobeMode ? 'globe' : 'mercator', // Sử dụng projection globe để hiển thị dạng quả cầu
      antialias: true,
    });

    mapRef.current = map;

    // Thêm các controls vào map
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Thêm hiệu ứng khi map đang tải
    map.on('style.load', () => {
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
    });

    map.on("load", () => {
      setMapLoaded(true);

      // Thêm nguồn dữ liệu địa hình 3D
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

      // Fly to location
      map.flyTo({
        center: [locationData.lng, locationData.lat],
        zoom: 3,
        pitch: 60,
        bearing: 30,
        duration: 3000
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.classList.remove('globe-mode');
      }
    };
  }, [isGlobeMode]);

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
    if (!searchQuery.trim() || !mapRef.current) return;

    try {
      setLocationSearch(searchQuery);

      // Sử dụng Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;

        updateLocation(lat, lng, locationData.radius, locationData.hint);

        // Bay đến vị trí tìm được
        mapRef.current?.flyTo({
          center: [lng, lat],
          zoom: 5,
          pitch: 60,
          bearing: 30,
          duration: 2000
        });

        toast({
          title: "Tìm thấy địa điểm",
          description: data.features[0].place_name,
        });
      } else {
        toast({
          title: "Không tìm thấy địa điểm",
          description: "Vui lòng thử tìm kiếm với từ khóa khác",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error searching location:", error);
      toast({
        title: "Lỗi tìm kiếm",
        description: "Đã xảy ra lỗi khi tìm kiếm địa điểm",
        variant: "destructive"
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

  // Xử lý chuyển đổi chế độ xem
  const handleViewMode = (mode: string) => {
    if (!mapRef.current) return;

    if (mode === '2d') {
      setIsGlobeMode(false);
      mapRef.current.setProjection('mercator');
      mapRef.current.easeTo({
        pitch: 0,
        bearing: 0
      });
    } else if (mode === '3d') {
      setIsGlobeMode(false);
      mapRef.current.setProjection('mercator');
      mapRef.current.easeTo({
        pitch: 60,
        bearing: 30
      });
    } else if (mode === 'globe') {
      setIsGlobeMode(true);
      mapRef.current.setProjection('globe');
      mapRef.current.easeTo({
        pitch: 45,
        bearing: 0,
        zoom: 1.5,
        center: [0, 20]
      });
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-medium text-center mb-2">
          {questionText || "Chọn vị trí trên bản đồ"}
        </h3>

        {!readonly && (
          <div className="flex items-center space-x-2 mb-2">
            <Input
              placeholder="Tìm kiếm địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-grow"
            />
            <Button onClick={handleSearch} size="icon">
              <Search className="h-4 w-4" />
            </Button>
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

          {/* Map controls */}
          {!readonly && (
            <div className="absolute top-4 right-16 flex gap-2">
              <Button
                size="sm"
                variant={!isGlobeMode && mapRef.current?.getPitch() === 0 ? "default" : "secondary"}
                onClick={() => handleViewMode('2d')}
              >
                2D
              </Button>
              <Button
                size="sm"
                variant={!isGlobeMode && ((mapRef.current?.getPitch() ?? 0) > 0) ? "default" : "secondary"}
                onClick={() => handleViewMode('3d')}
              >
                3D
              </Button>
              <Button
                size="sm"
                variant={isGlobeMode ? "default" : "secondary"}
                onClick={() => handleViewMode('globe')}
              >
                <Globe className="h-4 w-4 mr-1" /> Globe
              </Button>
            </div>
          )}
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