'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FlagTriangleRight, MapPin, Check, X, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

// Set your Mapbox access token
mapboxgl.accessToken =
  'pk.eyJ1IjoiY2NkY2MxMSIsImEiOiJjbWFnbXduZDkwMmV6MnFzbDIxM3dxMTJ4In0.2-eYJyMMthGbAa9SOtCDbQ';

interface LocationQuestionPlayerProps {
  questionText: string;
  locationData: {
    lat: number;
    lng: number;
    radius: number;
    hint?: string;
  };
  onAnswer: (
    isCorrect: boolean,
    distance: number,
    userLocation?: { lat: number; lng: number; radius: number }
  ) => void;
  mapStyle?: string;
  use3D?: boolean;
  useGlobe?: boolean;
  showCorrectLocation?: boolean;
  disabled?: boolean;
  userSelectedLocations?: { lat: number; lng: number; radius: number }[];
  correctAnswers?: { lat: number; lng: number; radius: number }[];
  isFullscreenMode?: boolean;
}

export function LocationQuestionPlayer({
  questionText,
  locationData,
  onAnswer,
  mapStyle = 'mapbox://styles/mapbox/streets-v12',
  use3D = false,
  useGlobe = false,
  showCorrectLocation = false,
  disabled = false,
  userSelectedLocations = [],
  correctAnswers = [],
  isFullscreenMode = false,
}: LocationQuestionPlayerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const correctLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const correctMarkersRef = useRef<mapboxgl.Marker[]>([]); // Ref cho multiple correct markers
  const userMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
              color: 'rgb(186, 210, 235)',
              'high-color': 'rgb(36, 92, 223)',
              'horizon-blend': 0.1,
              'space-color': 'rgb(11, 11, 25)',
              'star-intensity': 0.6,
            });

            // Add sky effect
            map.addLayer({
              id: 'sky',
              type: 'sky',
              paint: {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 90.0],
                'sky-atmosphere-sun-intensity': 15,
              },
            });
          } catch (error) {
            console.error('Error adding 3D effects:', error);
          }
        }
      });

      map.on('load', () => {
        setMapLoaded(true);

        try {
          // Add click handler to place marker for multiple selection
          map.on('click', (e) => {
            if (disabled) return; // Prevent changes when disabled

            const { lng, lat } = e.lngLat;

            console.log('[LocationQuestionPlayer] Map clicked:', {
              lng,
              lat,
              disabled,
            });

            // Validation: Kiểm tra khoảng cách với các vị trí đã chọn (validation 100m)
            if (userSelectedLocations && userSelectedLocations.length > 0) {
              const threshold = 0.001; // Giảm threshold xuống 100m để chính xác hơn
              const isTooClose = userSelectedLocations.some(
                (existing) =>
                  Math.abs(existing.lat - lat) < threshold &&
                  Math.abs(existing.lng - lng) < threshold
              );

              if (isTooClose) {
                console.log(
                  '[LocationQuestionPlayer] Vị trí quá gần với vị trí đã chọn, bỏ qua'
                );
                return; // Không tạo marker nếu quá gần
              }
            }

            // Logic thay thế marker khi vượt quá giới hạn
            const maxAllowed = correctAnswers.length || 1; // Mặc định là 1 nếu không có correctAnswers

            // Nếu đã đạt giới hạn tối đa, xóa marker đầu tiên
            if (
              userSelectedLocations &&
              userSelectedLocations.length >= maxAllowed
            ) {
              console.log(
                `[LocationQuestionPlayer] Đã đạt giới hạn tối đa: ${userSelectedLocations.length}/${maxAllowed}, xóa marker đầu tiên`
              );

              // Xóa marker đầu tiên từ map
              if (userMarkersRef.current.length > 0) {
                const firstMarker = userMarkersRef.current.shift(); // Lấy và xóa marker đầu tiên
                if (firstMarker) {
                  firstMarker.remove();
                  console.log(
                    '[LocationQuestionPlayer] Đã xóa marker đầu tiên'
                  );
                }
              }
            }

            // Tạo marker mới cho selection này
            const newMarker = new mapboxgl.Marker({
              color: '#FF0000',
              draggable: false, // Không cho drag để tránh confusion với multiple markers
            })
              .setLngLat([lng, lat])
              .addTo(map);

            console.log(
              '[LocationQuestionPlayer] Created new user marker:',
              newMarker
            );

            // Lưu marker vào userMarkersRef để có thể quản lý
            if (!userMarkersRef.current) {
              userMarkersRef.current = [];
            }
            userMarkersRef.current.push(newMarker);

            console.log(
              '[LocationQuestionPlayer] Total user markers now:',
              userMarkersRef.current.length
            );

            // Call onAnswer callback without causing rerender
            if (onAnswer) {
              const userLocation = { lat, lng, radius: locationData.radius };
              console.log(
                '[LocationQuestionPlayer] Calling onAnswer with:',
                userLocation
              );
              onAnswer(false, 0, userLocation);
            }
          });
        } catch (error) {
          console.error('Error setting up map click handling:', error);
        }
      });

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      return () => {};
    }
  }, [mapStyle, use3D, useGlobe, disabled, isBrowser]);

  // Effect to show correct location when showCorrectLocation is true
  useEffect(() => {
    if (!mapRef.current) return;

    // Reset flag khi showCorrectLocation thay đổi từ true về false
    if (!showCorrectLocation) {
      if (mapRef.current.getContainer()) {
        delete mapRef.current.getContainer().dataset.hasFlownToCorrect;
      }

      // Remove correct location markers và circles khi ẩn đáp án
      if (correctLocationMarkerRef.current) {
        correctLocationMarkerRef.current.remove();
        correctLocationMarkerRef.current = null;
      }

      // Remove multiple correct markers
      correctMarkersRef.current.forEach((marker) => marker.remove());
      correctMarkersRef.current = [];

      // Remove radius circles (có thể có nhiều)
      for (let i = 0; i < 10; i++) {
        // Giả sử tối đa 10 answers
        try {
          if (mapRef.current.getSource(`radius-circle-${i}`)) {
            mapRef.current.removeLayer(`radius-circle-outline-${i}`);
            mapRef.current.removeLayer(`radius-circle-${i}`);
            mapRef.current.removeSource(`radius-circle-${i}`);
          }
        } catch (error) {
          // Layer đã bị xóa hoặc không tồn tại
        }
      }

      // Remove legacy single radius circle
      if (mapRef.current.getSource('radius-circle')) {
        try {
          mapRef.current.removeLayer('radius-circle-outline');
          mapRef.current.removeLayer('radius-circle');
          mapRef.current.removeSource('radius-circle');
        } catch (error) {
          console.log('Legacy layers already removed');
        }
      }

      return;
    }

    try {
      // Sử dụng correctAnswers nếu có, ngược lại fallback về locationData
      const answersToShow =
        correctAnswers.length > 0 ? correctAnswers : [locationData];

      // Xóa old markers trước khi tạo mới
      if (correctLocationMarkerRef.current) {
        correctLocationMarkerRef.current.remove();
        correctLocationMarkerRef.current = null;
      }
      correctMarkersRef.current.forEach((marker) => marker.remove());
      correctMarkersRef.current = [];

      // Hiển thị tất cả correct locations
      answersToShow.forEach((answer, index) => {
        // Tạo green marker cho mỗi correct answer
        const correctMarker = new mapboxgl.Marker({
          color: '#00FF00',
        })
          .setLngLat([answer.lng, answer.lat])
          .addTo(mapRef.current!);

        correctMarkersRef.current.push(correctMarker);

        // Tạo radius circle cho mỗi answer
        const circleId = `radius-circle-${index}`;
        const outlineId = `radius-circle-outline-${index}`;

        // Xóa circle cũ nếu có
        try {
          if (mapRef.current!.getSource(circleId)) {
            mapRef.current!.removeLayer(outlineId);
            mapRef.current!.removeLayer(circleId);
            mapRef.current!.removeSource(circleId);
          }
        } catch (error) {
          console.log(`Không thể xóa circle cũ ${circleId}:`, error);
        }

        // Tạo circle data với radius chính xác
        const center = [answer.lng, answer.lat];
        const radiusInKm = answer.radius;
        const points = 64;
        const coordinates: [number, number][] = [];

        console.log(
          `[LocationQuestionPlayer] Tạo radius circle ${index + 1}:`,
          {
            center,
            radiusInKm,
            answer,
          }
        );

        for (let i = 0; i < points; i++) {
          const angle = (i / points) * 2 * Math.PI;
          const dx = radiusInKm * Math.cos(angle);
          const dy = radiusInKm * Math.sin(angle);

          // Convert km to degrees (chính xác hơn)
          const deltaLat = dy / 111.32;
          const deltaLng =
            dx / (111.32 * Math.cos((answer.lat * Math.PI) / 180));

          coordinates.push([center[0] + deltaLng, center[1] + deltaLat] as [
            number,
            number
          ]);
        }
        coordinates.push(coordinates[0]); // Close the circle

        // Đảm bảo map đã load xong style trước khi add source và layer
        const createCircle = () => {
          try {
            if (!mapRef.current || !mapRef.current.isStyleLoaded()) {
              console.log(
                `Circle ${index + 1}: Map chưa sẵn sàng, thử lại sau...`
              );
              setTimeout(createCircle, 100);
              return;
            }

            mapRef.current.addSource(circleId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [coordinates],
                },
              },
            });

            mapRef.current.addLayer({
              id: circleId,
              type: 'fill',
              source: circleId,
              paint: {
                'fill-color': '#00FF00',
                'fill-opacity': 0.2, // Tăng opacity để dễ thấy
              },
            });

            mapRef.current.addLayer({
              id: outlineId,
              type: 'line',
              source: circleId,
              paint: {
                'line-color': '#00FF00',
                'line-width': 3, // Tăng line width để dễ thấy
                'line-opacity': 0.8,
              },
            });

            console.log(
              `[LocationQuestionPlayer] Đã tạo radius circle ${
                index + 1
              } thành công`
            );
          } catch (error) {
            console.error(`Lỗi tạo radius circle ${index + 1}:`, error);
            // Thử lại sau 200ms
            setTimeout(createCircle, 200);
          }
        };

        // Bắt đầu tạo circle
        createCircle();

        console.log(
          `[LocationQuestionPlayer] Hiển thị correct answer ${index + 1}:`,
          answer
        );
      });

      // Đảm bảo user markers được hiển thị khi show correct location
      if (userSelectedLocations && userSelectedLocations.length > 0) {
        console.log(
          '[LocationQuestionPlayer] User markers sẽ được tạo bởi effect userSelectedLocations'
        );
      }

      // Luôn zoom vào đáp án khi showCorrectLocation = true
      console.log('[LocationQuestionPlayer] Flying to show all locations...');

      // Tạo bounds để hiển thị tất cả locations (correct answers + user selections)
      const bounds = new mapboxgl.LngLatBounds();

      // Thêm tất cả correct answers vào bounds
      answersToShow.forEach((answer) => {
        bounds.extend([answer.lng, answer.lat]);
      });

      // Thêm tất cả user selected locations vào bounds (nếu có)
      if (userSelectedLocations.length > 0) {
        userSelectedLocations.forEach((location) => {
          bounds.extend([location.lng, location.lat]);
        });
      }

      // Kiểm tra xem bounds có hợp lệ không (có ít nhất 1 điểm)
      const boundsValid = answersToShow.length > 0;

      if (boundsValid) {
        // Delay ngắn để đảm bảo markers đã được tạo
        setTimeout(() => {
          if (mapRef.current) {
            // Sử dụng fitBounds để hiển thị tất cả markers
            mapRef.current.fitBounds(bounds, {
              padding: 100, // Padding tốt
              duration: 2000, // Animation mượt
              maxZoom: answersToShow.length === 1 ? 12 : 15, // Zoom phù hợp
            });

            console.log(
              '[LocationQuestionPlayer] Fitted bounds to show all locations:',
              {
                correctAnswers: answersToShow.length,
                userSelections: userSelectedLocations.length,
                bounds: bounds,
              }
            );
          }
        }, 100);
      } else {
        // Fallback nếu không có location nào
        console.log(
          '[LocationQuestionPlayer] No locations to show, using default view'
        );
      }
    } catch (error) {
      console.error('Error showing correct locations:', error);
    }
  }, [
    showCorrectLocation,
    locationData,
    correctAnswers,
    userSelectedLocations,
  ]);

  // Function to calculate distance between two points in km
  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  // Function to search for places using Mapbox Geocoding API
  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxgl.accessToken}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to handle search result selection
  const handleSearchResultSelect = (result: any) => {
    if (!mapRef.current || disabled) return;

    const [lng, lat] = result.center;

    // Validation: Kiểm tra khoảng cách với các vị trí đã chọn
    if (userSelectedLocations && userSelectedLocations.length > 0) {
      const threshold = 0.001; // 100m threshold
      const isTooClose = userSelectedLocations.some(
        (existing) =>
          Math.abs(existing.lat - lat) < threshold &&
          Math.abs(existing.lng - lng) < threshold
      );

      if (isTooClose) {
        console.log(
          '[LocationQuestionPlayer] Search: Vị trí quá gần với vị trí đã chọn, bỏ qua'
        );
        return; // Không tạo marker nếu quá gần
      }
    }

    // Logic thay thế marker khi vượt quá giới hạn
    const maxAllowed = correctAnswers.length || 1; // Mặc định là 1 nếu không có correctAnswers

    // Nếu đã đạt giới hạn tối đa, xóa marker đầu tiên
    if (userSelectedLocations && userSelectedLocations.length >= maxAllowed) {
      console.log(
        `[LocationQuestionPlayer] Search: Đã đạt giới hạn tối đa: ${userSelectedLocations.length}/${maxAllowed}, xóa marker đầu tiên`
      );

      // Xóa marker đầu tiên từ map
      if (userMarkersRef.current.length > 0) {
        const firstMarker = userMarkersRef.current.shift(); // Lấy và xóa marker đầu tiên
        if (firstMarker) {
          firstMarker.remove();
          console.log(
            '[LocationQuestionPlayer] Search: Đã xóa marker đầu tiên'
          );
        }
      }
    }

    // Tạo marker mới (chỉ khi đã pass validation)
    const newMarker = new mapboxgl.Marker({
      color: '#FF0000',
      draggable: false,
    })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    // Thêm vào userMarkersRef để quản lý
    if (!userMarkersRef.current) {
      userMarkersRef.current = [];
    }
    userMarkersRef.current.push(newMarker);

    // Fly to the selected location
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 12,
      duration: 1500,
    });

    // Clear search results
    setSearchResults([]);
    setSearchQuery('');

    // Call onAnswer callback
    if (onAnswer) {
      const userLocation = { lat, lng, radius: locationData.radius };
      onAnswer(false, 0, userLocation);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchPlaces(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Effect để hiển thị user selected locations khi có userSelectedLocations
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    console.log('[LocationQuestionPlayer] User selected locations effect:', {
      userSelectedLocations,
      currentMarkersCount: userMarkersRef.current.length,
      showCorrectLocation,
      disabled,
    });

    // Luôn cập nhật markers để đồng bộ với userSelectedLocations
    // Xóa tất cả markers cũ trước khi tạo mới
    console.log(
      '[LocationQuestionPlayer] Đồng bộ hóa markers với userSelectedLocations'
    );

    userMarkersRef.current.forEach((marker) => marker.remove());
    userMarkersRef.current = [];

    // Tạo markers mới cho tất cả userSelectedLocations (nếu có)
    // Quan trọng: Luôn tạo user markers kể cả khi showCorrectLocation = true
    if (userSelectedLocations && userSelectedLocations.length > 0) {
      userSelectedLocations.forEach((location, index) => {
        const userMarker = new mapboxgl.Marker({
          color: '#FF0000', // Màu đỏ cho user selection
          draggable: false,
        })
          .setLngLat([location.lng, location.lat])
          .addTo(mapRef.current!);

        userMarkersRef.current.push(userMarker);

        console.log(
          `[LocationQuestionPlayer] Tạo user marker ${index + 1}:`,
          location,
          { showCorrectLocation, disabled }
        );
      });
    }
  }, [userSelectedLocations, showCorrectLocation]);

  return (
    <Card
      className={`w-full ${isFullscreenMode ? 'h-full flex flex-col' : ''}`}
    >
      <CardContent
        className={`pt-6 space-y-4 ${
          isFullscreenMode ? 'flex-1 flex flex-col h-full' : ''
        }`}
      >
        <h3 className='text-lg font-medium text-center mb-2'>
          {questionText || 'Chọn vị trí trên bản đồ'}
        </h3>

        {/* Hint section */}
        {locationData.hint && (
          <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 flex items-start'>
            <Button
              variant='ghost'
              size='sm'
              className='text-yellow-600 dark:text-yellow-400 p-0 h-auto mr-2'
              onClick={() => setShowHint(!showHint)}
            >
              <FlagTriangleRight className='h-5 w-5' />
            </Button>
            <div>
              <p className='font-medium text-sm text-yellow-800 dark:text-yellow-400'>
                {showHint ? locationData.hint : 'Gợi ý (Nhấn để xem)'}
              </p>
            </div>
          </div>
        )}

        {/* Search bar */}
        {!disabled && (
          <div className='relative'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Tìm kiếm địa điểm...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
                disabled={disabled}
              />
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className='absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto'>
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    className='w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors'
                    onClick={() => handleSearchResultSelect(result)}
                  >
                    <div className='font-medium text-sm'>{result.text}</div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      {result.place_name}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Loading indicator */}
            {isSearching && (
              <div className='absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-4 text-center'>
                <div className='text-sm text-muted-foreground'>
                  Đang tìm kiếm...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Thông báo số lượng điểm có thể chọn */}
        {!disabled && (
          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3'>
            <div className='flex items-center gap-2'>
              <MapPin className='h-4 w-4 text-blue-600 dark:text-blue-400' />
              <p className='text-sm text-blue-800 dark:text-blue-400'>
                <span className='font-medium'>
                  Có thể chọn tối đa {correctAnswers.length || 1} vị trí
                </span>
                {(correctAnswers.length || 1) > 1 ? (
                  <span className='text-blue-600 dark:text-blue-300 ml-1'>
                    • Chọn vượt quá sẽ thay thế vị trí cũ nhất
                  </span>
                ) : (
                  <span className='text-blue-600 dark:text-blue-300 ml-1'>
                    • Chọn vị trí mới sẽ thay thế vị trí cũ
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Map container */}
        <div
          className={`relative ${
            isFullscreenMode ? 'flex-1 flex flex-col' : ''
          }`}
        >
          <div
            ref={mapContainerRef}
            className={`w-full ${
              isFullscreenMode
                ? 'flex-1 min-h-[300px]'
                : 'h-[300px] sm:h-[400px]'
            } bg-slate-100 dark:bg-slate-800 rounded-lg`}
          />
        </div>

        {/* Selected coordinates display */}
        {userSelectedLocations &&
          userSelectedLocations.length > 0 &&
          !disabled && (
            <div className='bg-muted/30 p-3 rounded-md text-sm text-center'>
              <p>Đã chọn {userSelectedLocations.length} vị trí</p>
              <p className='text-muted-foreground text-xs mt-1'>
                {userSelectedLocations.length < (correctAnswers.length || 1)
                  ? `Nhấp vào bản đồ để thêm vị trí mới (còn ${
                      (correctAnswers.length || 1) -
                      userSelectedLocations.length
                    } vị trí)`
                  : 'Nhấp vào bản đồ để thay thế vị trí cũ nhất'}
              </p>
            </div>
          )}

        {showCorrectLocation && (
          <div className='text-sm text-center text-muted-foreground'>
            Vị trí chính xác: {locationData.lat.toFixed(6)},{' '}
            {locationData.lng.toFixed(6)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
