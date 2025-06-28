'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Circle,
  Clock,
  Hash,
  HelpCircle,
  MapPin,
  MessageSquare,
  Square,
  Target,
  Shuffle,
  Presentation,
  Link2,
  Monitor,
  Tablet,
  Smartphone,
  ChevronDown,
  ChevronUp,
  FileText,
  List,
  ArrowUpDown,
  RotateCcw,
  XCircle,
  Image,
  Zap,
  Pencil,
  GripVertical,
  Radio,
  CheckSquare,
  Type,
  MoveVertical,
  Edit,
  Plus,
  Trash,
  Info,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Award,
  Settings,
  Fullscreen,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Grid,
  BookOpen,
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Feature, Polygon } from 'geojson';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import InfoSlideViewer from './info-slide-viewer';

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

// Set Mapbox access token
mapboxgl.accessToken =
  'pk.eyJ1IjoiY2NkY2MxMSIsImEiOiJjbWFnbXduZDkwMmV6MnFzbDIxM3dxMTJ4In0.2-eYJyMMthGbAa9SOtCDbQ';

// Interface definitions for API data structure
interface QuizAnswer {
  quizAnswerId: string;
  answerText: string;
  isCorrect: boolean;
  orderIndex: number;
  explanation?: string;
}

interface QuizLocationAnswer {
  quizLocationAnswerId: string;
  longitude: number;
  latitude: number;
  radius: number;
}

interface MatchingPairItem {
  quizMatchingPairItemId: string;
  content: string;
  isLeftColumn: boolean;
  displayOrder: number;
}

interface MatchingPairConnection {
  quizMatchingPairConnectionId: string;
  leftItem: MatchingPairItem;
  rightItem: MatchingPairItem;
}

interface QuizMatchingPairAnswer {
  quizMatchingPairAnswerId: string;
  leftColumnName: string;
  rightColumnName: string;
  items: MatchingPairItem[];
  connections: MatchingPairConnection[];
}

interface Quiz {
  quizId: string;
  questionText: string;
  timeLimitSeconds: number;
  pointType: string;
  quizAnswers: QuizAnswer[];
  quizLocationAnswers: QuizLocationAnswer[];
  quizMatchingPairAnswer?: QuizMatchingPairAnswer;
}

interface SlideElement {
  slideElementId: string;
  slideElementType: 'TEXT' | 'IMAGE';
  positionX: number; // %
  positionY: number; // %
  width: number; // %
  height: number; // %
  rotation: number; // deg
  layerOrder: number;
  displayOrder: number;
  content: string | null;
  sourceUrl: string | null;
  entryAnimation: string | null;
  entryAnimationDuration: number | null;
  entryAnimationDelay: number | null;
  exitAnimation: string | null;
  exitAnimationDuration: number | null;
  exitAnimationDelay: number | null;
}

interface Slide {
  slideId: string;
  transitionEffect: string | null;
  transitionDuration: number;
  autoAdvanceSeconds: number;
  slideElements: SlideElement[];
}

interface Activity {
  activityId: string;
  activityType: string;
  title: string;
  description: string;
  isPublished: boolean;
  orderIndex: number;
  backgroundColor?: string;
  backgroundImage?: string | null;
  customBackgroundMusic?: string | null;
  quiz?: Quiz;
  slide?: Slide;
}

interface QuestionViewerProps {
  activities: Activity[];
  collectionTitle: string;
}

const PAIR_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];

export function QuestionViewerComponent({
  activities,
  collectionTitle,
}: QuestionViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>(
    'desktop'
  );
  const [isQuestionListCollapsed, setIsQuestionListCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showAnswers, setShowAnswers] = useState(false);
  const [progressMode, setProgressMode] = useState<'manual' | 'auto'>('manual');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sort activities by orderIndex to ensure proper display order
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [activities]);

  const totalQuestions = useMemo(
    () => sortedActivities.length,
    [sortedActivities]
  );

  const currentActivity = useMemo(() => {
    return sortedActivities[currentIndex] || null;
  }, [sortedActivities, currentIndex]);

  const completionPercentage = useMemo(() => {
    return totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  }, [currentIndex, totalQuestions]);

  const estimatedTimeRemaining = useMemo(() => {
    const remainingActivities = sortedActivities.slice(currentIndex + 1);
    return remainingActivities.reduce((total, activity) => {
      return total + (activity.quiz?.timeLimitSeconds || 30);
    }, 0);
  }, [sortedActivities, currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentProgress(0);
    }
  }, [currentIndex, totalQuestions]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setCurrentProgress(0);
    }
  }, [currentIndex]);

  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) {
        setCurrentIndex(index);
        setCurrentProgress(0);
        scrollToQuestion(index);
      }
    },
    [totalQuestions]
  );

  const getQuestionType = useCallback((activityType: string) => {
    const typeMap: Record<string, string> = {
      QUIZ_BUTTONS: 'multiple_choice',
      QUIZ_CHECKBOXES: 'multiple_response',
      QUIZ_TRUE_OR_FALSE: 'true_false',
      QUIZ_TYPE_ANSWER: 'text_answer',
      QUIZ_REORDER: 'reorder',
      QUIZ_LOCATION: 'location',
      QUIZ_MATCHING_PAIRS: 'matching_pair',
      INFO_SLIDE: 'info_slide',
      SLIDE: 'slide',
    };
    return typeMap[activityType] || 'multiple_choice';
  }, []);

  const getQuestionTypeColor = useCallback((questionType: string) => {
    const colorMap: Record<string, string> = {
      multiple_choice: 'from-blue-500 to-blue-600',
      multiple_response: 'from-green-500 to-green-600',
      true_false: 'from-purple-500 to-purple-600',
      text_answer: 'from-orange-500 to-orange-600',
      reorder: 'from-pink-500 to-pink-600',
      location: 'from-red-500 to-red-600',
      matching_pair: 'from-indigo-500 to-indigo-600',
      slide: 'from-yellow-500 to-yellow-600',
      info_slide: 'from-cyan-500 to-cyan-600',
    };
    return colorMap[questionType] || 'from-gray-500 to-gray-600';
  }, []);

  const getQuestionTypeIcon = useCallback((questionType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      multiple_choice: <Circle className='w-5 h-5' />,
      multiple_response: <Square className='w-5 h-5' />,
      true_false: <HelpCircle className='w-5 h-5' />,
      text_answer: <MessageSquare className='w-5 h-5' />,
      reorder: <Shuffle className='w-5 h-5' />,
      location: <MapPin className='w-5 h-5' />,
      matching_pair: <Link2 className='w-5 h-5' />,
      slide: <Presentation className='w-5 h-5' />,
      info_slide: <Info className='w-5 h-5' />,
    };
    return iconMap[questionType] || <Circle className='w-5 h-5' />;
  }, []);

  const getQuestionTypeDisplayName = useCallback((questionType: string) => {
    const nameMap: Record<string, string> = {
      multiple_choice: 'Trắc nghiệm',
      multiple_response: 'Nhiều lựa chọn',
      true_false: 'Đúng/Sai',
      text_answer: 'Điền từ',
      reorder: 'Sắp xếp',
      location: 'Địa điểm',
      matching_pair: 'Ghép cặp',
      slide: 'Slide',
      info_slide: 'Slide thông tin',
    };
    return nameMap[questionType] || 'Câu hỏi';
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const scrollToQuestion = useCallback((index: number) => {
    const element = document.getElementById(`question-${index}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);

  // Enhanced intersection observer for tracking current question
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const questionId = entry.target.id;
            const index = parseInt(questionId.replace('question-', ''));
            if (!isNaN(index) && index !== currentIndex) {
              setCurrentIndex(index);
            }
          }
        });
      },
      {
        threshold: 0.6,
        rootMargin: '-20% 0px -20% 0px',
      }
    );

    questionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [sortedActivities.length, currentIndex]);

  useEffect(() => {
    if (autoPlay && isPlaying && currentActivity) {
      const duration =
        ((currentActivity.quiz?.timeLimitSeconds || 30) * 1000) / playbackSpeed;

      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentProgress((prev) => {
          const newProgress = prev + 100 / (duration / 100);

          if (newProgress >= 100) {
            goToNext();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => {
        if (autoPlayIntervalRef.current) {
          clearInterval(autoPlayIntervalRef.current);
        }
      };
    }
  }, [autoPlay, isPlaying, currentActivity, playbackSpeed, goToNext]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return; // Don't interfere with form inputs
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case ' ':
          event.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'f':
          event.preventDefault();
          setIsFullscreen((prev) => !prev);
          break;
        case 'a':
          event.preventDefault();
          setShowAnswers((prev) => !prev);
          break;
        case 'Escape':
          event.preventDefault();
          setIsFullscreen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen not supported:', error);
    }
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const resetProgress = useCallback(() => {
    setCurrentProgress(0);
    setIsPlaying(false);
  }, []);

  const LocationMapComponent = React.memo(
    ({ activity }: { activity: Activity }) => {
      const mapContainerRef = useRef<HTMLDivElement>(null);
      const mapRef = useRef<mapboxgl.Map | null>(null);
      const markersRef = useRef<Map<number, mapboxgl.Marker>>(new Map());
      const [mapLoaded, setMapLoaded] = useState(false);
      const [isBrowser, setIsBrowser] = useState(false);
      const [mapError, setMapError] = useState<string | null>(null);

      useEffect(() => {
        setIsBrowser(true);
      }, []);

      useEffect(() => {
        if (
          !isBrowser ||
          !mapContainerRef.current ||
          !activity.quiz?.quizLocationAnswers?.length
        ) {
          return;
        }

        const locationAnswers = activity.quiz.quizLocationAnswers;

        try {
          const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [locationAnswers[0].longitude, locationAnswers[0].latitude],
            zoom: 12,
            attributionControl: false,
          });

          mapRef.current = map;

          map.addControl(new mapboxgl.NavigationControl(), 'top-right');

          map.on('load', () => {
            setMapLoaded(true);

            locationAnswers.forEach((location, index) => {
              const markerElement = document.createElement('div');
              markerElement.className =
                'w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm';
              markerElement.textContent = (index + 1).toString();

              const marker = new mapboxgl.Marker(markerElement)
                .setLngLat([location.longitude, location.latitude])
                .addTo(map);

              const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div class="p-3">
                  <div class="font-semibold text-gray-900 mb-2">Điểm ${
                    index + 1
                  }</div>
                  <div class="text-sm text-gray-600 space-y-1">
                    <div><strong>Vĩ độ:</strong> ${location.latitude.toFixed(
                      6
                    )}</div>
                    <div><strong>Kinh độ:</strong> ${location.longitude.toFixed(
                      6
                    )}</div>
                    <div><strong>Bán kính:</strong> ${location.radius}km</div>
                  </div>
                </div>
              `);

              marker.setPopup(popup);
              markersRef.current.set(index, marker);

              // Add radius circle - referencing QuizLocationMap.tsx logic
              const circleId = `radius-circle-${index}`;
              const outlineId = `radius-circle-outline-${index}`;

              // Calculate circle coordinates
              const center = [location.longitude, location.latitude];
              const radiusInKm = location.radius;
              const points = 64;
              const coordinates: [number, number][] = [];

              for (let i = 0; i < points; i++) {
                const angle = (i / points) * 2 * Math.PI;
                const dx = radiusInKm * Math.cos(angle);
                const dy = radiusInKm * Math.sin(angle);

                // Convert km to degrees (chính xác hơn)
                const deltaLat = dy / 111.32;
                const deltaLng =
                  dx / (111.32 * Math.cos((location.latitude * Math.PI) / 180));

                coordinates.push([
                  center[0] + deltaLng,
                  center[1] + deltaLat,
                ] as [number, number]);
              }
              coordinates.push(coordinates[0]); // Close the circle

              // Add circle source and layers
              const createCircle = () => {
                try {
                  if (!map || !map.isStyleLoaded()) {
                    console.log(
                      `Circle ${index + 1}: Map chưa sẵn sàng, thử lại sau...`
                    );
                    setTimeout(createCircle, 100);
                    return;
                  }

                  // Remove existing circle if any
                  try {
                    if (map.getSource(circleId)) {
                      map.removeLayer(outlineId);
                      map.removeLayer(circleId);
                      map.removeSource(circleId);
                    }
                  } catch (error) {
                    // Layer không tồn tại
                  }

                  map.addSource(circleId, {
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

                  map.addLayer({
                    id: circleId,
                    type: 'fill',
                    source: circleId,
                    paint: {
                      'fill-color': '#3b82f6',
                      'fill-opacity': 0.15, // Nhẹ để không che khuất map
                    },
                  });

                  map.addLayer({
                    id: outlineId,
                    type: 'line',
                    source: circleId,
                    paint: {
                      'line-color': '#1d4ed8',
                      'line-width': 2,
                      'line-opacity': 0.8,
                    },
                  });

                  console.log(
                    `[LocationMapComponent] Đã tạo radius circle ${
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
            });

            // Fit bounds to show all locations and their radius
            if (locationAnswers.length > 0) {
              const bounds = new mapboxgl.LngLatBounds();

              locationAnswers.forEach((location) => {
                // Add center point
                bounds.extend([location.longitude, location.latitude]);

                // Add radius area to bounds
                const radiusInKm = location.radius;
                const deltaLat = radiusInKm / 111.32;
                const deltaLng =
                  radiusInKm /
                  (111.32 * Math.cos((location.latitude * Math.PI) / 180));

                bounds.extend([
                  location.longitude + deltaLng,
                  location.latitude + deltaLat,
                ]);
                bounds.extend([
                  location.longitude - deltaLng,
                  location.latitude - deltaLat,
                ]);
              });

              setTimeout(() => {
                map.fitBounds(bounds, {
                  padding: 50,
                  duration: 1000,
                });
              }, 500);
            }
          });

          map.on('error', (e) => {
            console.error('Map error:', e);
            setMapError(
              'Không thể tải bản đồ. Vui lòng kiểm tra kết nối internet.'
            );
          });

          return () => {
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current.clear();
            map.remove();
          };
        } catch (error) {
          console.error('Map initialization error:', error);
          setMapError('Lỗi khởi tạo bản đồ');
        }
      }, [isBrowser, activity.quiz?.quizLocationAnswers]);

      if (mapError) {
        return (
          <div className='w-full h-64 sm:h-80 lg:h-96 bg-gray-100 rounded-lg overflow-hidden relative'>
            <div className='text-center'>
              <MapPin className='w-12 h-12 text-gray-400 mx-auto mb-2' />
              <p className='text-gray-600'>{mapError}</p>
            </div>
          </div>
        );
      }

      return (
        <div className='w-full h-64 sm:h-80 lg:h-96 bg-gray-100 rounded-lg overflow-hidden relative'>
          <div ref={mapContainerRef} className='w-full h-full' />
          {!mapLoaded && (
            <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
              <div className='animate-pulse flex flex-col items-center'>
                <div className='w-8 sm:w-12 h-8 sm:h-12 bg-gray-300 rounded-full mb-2'></div>
                <div className='text-sm sm:text-base text-gray-500'>
                  Đang tải bản đồ...
                </div>
              </div>
            </div>
          )}

          {/* Legend hiển thị thông tin radius */}
          {mapLoaded && activity.quiz?.quizLocationAnswers && (
            <div className='absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 sm:p-3 max-w-xs text-xs sm:text-sm'>
              <div className='font-semibold text-gray-800 mb-1 sm:mb-2'>
                Chú thích:
              </div>
              <div className='space-y-1 text-gray-600'>
                <div className='flex items-center gap-2'>
                  <div className='w-2.5 sm:w-3 h-2.5 sm:h-3 bg-red-500 rounded-full border border-white'></div>
                  <span>Vị trí chính xác</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-2.5 sm:w-3 h-2.5 sm:h-3 border-2 border-blue-600 rounded-full bg-blue-100'></div>
                  <span>Vùng chấp nhận (bán kính)</span>
                </div>
                {activity.quiz.quizLocationAnswers.length > 1 && (
                  <div className='mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-200'>
                    <div className='text-xs text-gray-500'>
                      {activity.quiz.quizLocationAnswers.length} điểm cần tìm
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
  );

  LocationMapComponent.displayName = 'LocationMapComponent';

  // Matching Pairs Component with SVG connections
  const MatchingPairsComponent = ({ activity }: { activity: Activity }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [forceUpdate, setForceUpdate] = useState(0);

    if (!activity.quiz?.quizMatchingPairAnswer) {
      return (
        <div className='text-center text-gray-500 p-8'>
          Không có dữ liệu matching pairs
        </div>
      );
    }

    const matchingPairData = activity.quiz.quizMatchingPairAnswer;
    const leftColumnName = matchingPairData.leftColumnName || 'Left Column';
    const rightColumnName = matchingPairData.rightColumnName || 'Right Column';

    // Tách items thành 2 cột
    const leftItems = matchingPairData.items.filter(
      (item) => item.isLeftColumn
    );
    const rightItems = matchingPairData.items.filter(
      (item) => !item.isLeftColumn
    );

    // Sắp xếp theo displayOrder
    const sortedLeftItems = leftItems.sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    const sortedRightItems = rightItems.sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    // Danh sách màu cho connections
    const PAIR_COLORS = [
      '#3b82f6', // blue
      '#a855f7', // purple
      '#eab308', // yellow
      '#f97316', // orange
      '#06b6d4', // cyan
      '#ec4899', // pink
      '#6366f1', // indigo
    ];

    // Tạo color map cho connections
    const pairColorMap = new Map<string, string>();
    if (matchingPairData.connections) {
      matchingPairData.connections.forEach((connection, index) => {
        if (connection.quizMatchingPairConnectionId) {
          pairColorMap.set(
            connection.quizMatchingPairConnectionId,
            PAIR_COLORS[index % PAIR_COLORS.length]
          );
        }
      });
    }

    // Force update để redraw connections khi cần thiết
    useEffect(() => {
      const timer = setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
      }, 500);

      return () => clearTimeout(timer);
    }, [matchingPairData.connections]);

    const getConnectionPath = (leftItemId: string, rightItemId: string) => {
      const leftElement = document.getElementById(`item-${leftItemId}`);
      const rightElement = document.getElementById(`item-${rightItemId}`);
      const svgElement = svgRef.current;

      if (!leftElement || !rightElement || !svgElement) return '';

      const svgRect = svgElement.getBoundingClientRect();
      const leftRect = leftElement.getBoundingClientRect();
      const rightRect = rightElement.getBoundingClientRect();

      const startX = leftRect.right - svgRect.left;
      const startY = leftRect.top + leftRect.height / 2 - svgRect.top;
      const endX = rightRect.left - svgRect.left;
      const endY = rightRect.top + rightRect.height / 2 - svgRect.top;

      // Calculate control points for smooth curve
      const controlY = startY + (endY - startY) / 2;
      const controlX1 = startX + (endX - startX) * 0.25;
      const controlX2 = startX + (endX - startX) * 0.75;

      return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
    };

    return (
      <div className='w-full bg-gray-50 dark:bg-gray-800 min-h-[500px]'>
        {/* Main content container */}
        <div
          ref={containerRef}
          className='matching-pair-preview relative p-3 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-800'
          key={`preview-${forceUpdate}`}
        >
          <div className='flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-8 lg:gap-12 w-full max-w-6xl mx-auto'>
            {/* Left Column */}
            <div className='w-full sm:w-1/2 flex flex-col items-center gap-3 sm:gap-4 lg:gap-6'>
              <h3 className='font-bold text-lg sm:text-xl text-center text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm w-full sm:w-auto'>
                {leftColumnName}
              </h3>
              <div className='w-full space-y-2 sm:space-y-3 lg:space-y-4'>
                {sortedLeftItems.map((item, index) => {
                  // Find the connection for this item
                  const connection = matchingPairData.connections?.find(
                    (c) =>
                      c.leftItem.quizMatchingPairItemId ===
                      item.quizMatchingPairItemId
                  );
                  const connectionColor =
                    connection?.quizMatchingPairConnectionId
                      ? pairColorMap.get(
                          connection.quizMatchingPairConnectionId
                        )
                      : '#e5e7eb'; // default gray

                  return (
                    <div
                      key={`${item.quizMatchingPairItemId}-${forceUpdate}`}
                      id={`item-${item.quizMatchingPairItemId}`}
                      className='p-3 sm:p-4 rounded-full text-center transition-all duration-200 w-full border-2 shadow-md hover:shadow-lg'
                      style={{
                        backgroundColor: connectionColor,
                        borderColor: connectionColor,
                        color:
                          connectionColor === '#e5e7eb' ? '#374151' : 'white',
                      }}
                    >
                      <p className='text-xs sm:text-sm lg:text-base font-medium break-words'>
                        {item.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column */}
            <div className='w-full sm:w-1/2 flex flex-col items-center gap-3 sm:gap-4 lg:gap-6'>
              <h3 className='font-bold text-lg sm:text-xl text-center text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm w-full sm:w-auto'>
                {rightColumnName}
              </h3>
              <div className='w-full space-y-2 sm:space-y-3 lg:space-y-4'>
                {sortedRightItems.map((item, index) => {
                  // Find the connection for this item
                  const connection = matchingPairData.connections?.find(
                    (c) =>
                      c.rightItem.quizMatchingPairItemId ===
                      item.quizMatchingPairItemId
                  );
                  const connectionColor =
                    connection?.quizMatchingPairConnectionId
                      ? pairColorMap.get(
                          connection.quizMatchingPairConnectionId
                        )
                      : '#e5e7eb'; // default gray

                  return (
                    <div
                      key={`${item.quizMatchingPairItemId}-${forceUpdate}`}
                      id={`item-${item.quizMatchingPairItemId}`}
                      className='p-4 rounded-full text-center transition-all duration-200 w-full border-2 shadow-md hover:shadow-lg'
                      style={{
                        backgroundColor: connectionColor,
                        borderColor: connectionColor,
                        color:
                          connectionColor === '#e5e7eb' ? '#374151' : 'white',
                      }}
                    >
                      <p className='text-sm md:text-base font-medium'>
                        {item.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SVG for drawing connection lines - Hide on mobile for better readability */}
          <svg
            ref={svgRef}
            className='hidden sm:block absolute top-0 left-0 w-full h-full pointer-events-none'
            style={{ zIndex: 20 }}
            key={`svg-${forceUpdate}`}
          >
            <defs>
              {PAIR_COLORS.map((color) => (
                <marker
                  key={color}
                  id={`marker-${color.replace('#', '')}`}
                  markerWidth='8'
                  markerHeight='8'
                  refX='4'
                  refY='4'
                >
                  <circle
                    cx='4'
                    cy='4'
                    r='3'
                    fill='white'
                    stroke={color}
                    strokeWidth='1.5'
                  />
                </marker>
              ))}
            </defs>
            <g>
              {matchingPairData.connections?.map((conn, index) => {
                const pathColor = conn.quizMatchingPairConnectionId
                  ? pairColorMap.get(conn.quizMatchingPairConnectionId)
                  : '#3b82f6';

                return (
                  <path
                    key={`${conn.leftItem.quizMatchingPairItemId}-${conn.rightItem.quizMatchingPairItemId}-${index}-${forceUpdate}`}
                    d={getConnectionPath(
                      conn.leftItem.quizMatchingPairItemId!,
                      conn.rightItem.quizMatchingPairItemId!
                    )}
                    stroke={pathColor}
                    strokeWidth='3'
                    fill='none'
                    markerStart={
                      pathColor
                        ? `url(#marker-${pathColor.replace('#', '')})`
                        : undefined
                    }
                    markerEnd={
                      pathColor
                        ? `url(#marker-${pathColor.replace('#', '')})`
                        : undefined
                    }
                  />
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // Render slide content
  const renderSlideContent = (activity: Activity) => {
    const slideTypeText =
      activity.activityType === 'INFO_SLIDE' ? 'Info Slide' : 'Slide';
    const slideIndex =
      sortedActivities.findIndex((a) => a.activityId === activity.activityId) +
      1;

    return (
      <Card
        className={cn(
          'border-none rounded-xl shadow-lg overflow-hidden transition-all duration-300 mx-auto w-full',
          currentIndex === slideIndex - 1
            ? 'ring-2 ring-primary/20 scale-100'
            : 'scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]',
          viewMode === 'desktop' && 'max-w-full',
          viewMode === 'tablet' && 'max-w-2xl lg:max-w-4xl',
          viewMode === 'mobile' && 'max-w-sm'
        )}
      >
        <div className='flex flex-col items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 pb-6 sm:pb-8 pt-3 sm:pt-4 bg-gradient-to-br from-indigo-100/90 via-purple-100/80 to-blue-100/90 dark:from-indigo-900/90 dark:via-purple-900/80 dark:to-blue-900/95 min-h-[300px] sm:min-h-[400px]'>
          <div className='w-full flex justify-between mb-2 sm:mb-3'>
            <div className='flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300'></div>
            <motion.div
              className='flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className='h-3 w-3 sm:h-4 sm:w-4 text-white' />
              <span className='text-xs sm:text-sm font-medium text-white'>
                {slideTypeText} {slideIndex}
              </span>
            </motion.div>
          </div>

          <div className='flex-1 w-full flex items-center justify-center'>
            <div
              className={cn(
                'w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden',
                viewMode === 'mobile' && 'max-w-sm',
                viewMode === 'tablet' && 'max-w-2xl',
                viewMode === 'desktop' && 'max-w-4xl'
              )}
              style={{
                height:
                  viewMode === 'mobile'
                    ? '250px'
                    : viewMode === 'tablet'
                    ? '350px'
                    : '460px',
              }}
            >
              {activity.backgroundImage ? (
                <div
                  className='w-full h-full bg-cover bg-center flex items-center justify-center'
                  style={{
                    backgroundImage: `url(${activity.backgroundImage})`,
                    backgroundColor: activity.backgroundColor || '#FFFFFF',
                  }}
                >
                  <div className='bg-black/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 max-w-2xl mx-2 sm:mx-4'>
                    <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-3 sm:mb-4'>
                      {activity.title || `${slideTypeText} ${slideIndex}`}
                    </h1>
                    {/* {activity.description && (
                      <p className='text-white/90 text-center text-sm sm:text-lg'>
                        {activity.description}
                      </p>
                    )} */}
                  </div>
                </div>
              ) : (
                <div
                  className='w-full h-full flex items-center justify-center p-4 sm:p-8'
                  style={{
                    backgroundColor: activity.backgroundColor || '#FFFFFF',
                  }}
                >
                  <div className='text-center max-w-2xl'>
                    <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4'>
                      {activity.title || `${slideTypeText} ${slideIndex}`}
                    </h1>
                    {/* {activity.description && (
                      <p className='text-gray-600 dark:text-gray-300 text-sm sm:text-lg'>
                        {activity.description}
                      </p>
                    )} */}

                    {/* Slide elements if available */}
                    {activity.slide?.slideElements &&
                      activity.slide.slideElements.length > 0 && (
                        <div className='mt-4 sm:mt-6 space-y-3 sm:space-y-4'>
                          {activity.slide.slideElements.map((element) => (
                            <div
                              key={element.slideElementId}
                              className='p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'
                            >
                              <div
                                className='text-sm sm:text-base text-gray-800 dark:text-gray-200'
                                dangerouslySetInnerHTML={{
                                  __html: element.content || '',
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Render options for quiz questions
  const renderQuizOptions = (activity: Activity, questionType: string) => {
    if (!activity.quiz?.quizAnswers) {
      return null;
    }

    const options = activity.quiz.quizAnswers;

    // Handle true/false questions
    if (questionType === 'true_false') {
      return (
        <div className='p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-white dark:bg-gray-800'>
          {options.map((option, optionIndex) => {
            const isTrue = option.answerText.toLowerCase() === 'true';
            return (
              <div
                key={option.quizAnswerId}
                className={cn(
                  'rounded-lg p-2 sm:p-3 flex items-center gap-2 sm:gap-3 border transition-all duration-200 relative group',
                  option.isCorrect
                    ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : isTrue
                    ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm',
                    isTrue ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  )}
                >
                  {isTrue ? (
                    <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4' />
                  ) : (
                    <XCircle className='h-3 w-3 sm:h-4 sm:w-4' />
                  )}
                </div>
                <span className='text-sm sm:text-base font-medium flex-1'>
                  {option.answerText}
                </span>
                {option.isCorrect && (
                  <div className='bg-green-500 text-white rounded-full p-1'>
                    <CheckCircle className='h-2.5 w-2.5 sm:h-3 sm:w-3' />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Handle text answer questions
    if (questionType === 'text_answer') {
      return (
        <div className='p-3 sm:p-4 bg-white dark:bg-gray-800'>
          {/* Text input field placeholder */}
          <div className='bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4 mb-3'>
            <div className='h-8 sm:h-9 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 px-3 flex items-center text-gray-500 dark:text-gray-400 text-sm'>
              Type your answer here...
            </div>
          </div>

          {/* Correct answer display */}
          <div className='mt-2 text-sm text-gray-600 dark:text-white italic relative group'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0'>
              <span className='font-medium'>Correct answer:</span>{' '}
              <span className='sm:ml-1 font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800 break-words'>
                {options.find((opt) => opt.isCorrect)?.answerText ||
                  'Not specified'}
              </span>
            </div>
          </div>

          {/* Help text */}
          <div className='mt-3 text-xs text-gray-500 dark:text-gray-400'>
            <p className='flex items-start sm:items-center gap-1.5'>
              <Info className='h-3.5 w-3.5 mt-0.5 sm:mt-0 text-blue-500 flex-shrink-0' />
              <span>
                This is a read-only preview of the text answer question
              </span>
            </p>
          </div>
        </div>
      );
    }

    // Handle reorder questions
    if (questionType === 'reorder') {
      return (
        <div className='py-2 sm:py-3 px-3 sm:px-4 bg-white dark:bg-black'>
          <div className='text-xs text-gray-500 dark:text-gray-400 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1'>
            <div className='flex items-center'>
              <MoveVertical className='h-3.5 w-3.5 mr-1.5' />
              <span>Thứ tự các bước - Bật chế độ chỉnh sửa để sắp xếp lại</span>
            </div>
          </div>

          <div className='relative space-y-2'>
            {/* Connecting line for visual guidance */}
            {options.length > 1 && (
              <div className='absolute left-4 sm:left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 z-0'></div>
            )}

            {options
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((option, index) => (
                <div
                  key={option.quizAnswerId}
                  className='flex items-center gap-2 p-1.5 relative mb-2 transition-all duration-300'
                >
                  <div className='flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 flex-1 relative z-10'>
                    <div className='w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-600 dark:bg-gray-400 text-white dark:text-gray-900 flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm'>
                      {index + 1}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <span className='text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 break-words'>
                        {option.answerText}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      );
    }

    // Handle multiple choice and multiple response questions
    if (['multiple_choice', 'multiple_response'].includes(questionType)) {
      return (
        <div
          className={cn(
            'p-3 sm:p-4 bg-white dark:bg-gray-800',
            // Mobile-first responsive grid
            'grid gap-2 sm:gap-3',
            // Responsive columns based on number of options and screen size
            options.length <= 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : options.length <= 4
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            // Override for view mode
            viewMode === 'mobile' && 'grid-cols-1',
            viewMode === 'tablet' && options.length > 4 && 'grid-cols-2'
          )}
        >
          {options.map((option, optionIndex) => {
            const optionLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'][
              optionIndex
            ];
            const optionColors = [
              'bg-blue-500',
              'bg-pink-500',
              'bg-green-500',
              'bg-orange-500',
              'bg-purple-500',
              'bg-cyan-500',
              'bg-red-500',
              'bg-yellow-500',
              'bg-teal-500',
            ];

            return (
              <div
                key={option.quizAnswerId}
                className={cn(
                  'rounded-lg border p-2 sm:p-3 flex items-center gap-2 sm:gap-3 transition-all duration-200 relative group',
                  option.isCorrect
                    ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-sm text-xs sm:text-sm font-medium',
                    optionColors[optionIndex % optionColors.length]
                  )}
                >
                  {optionLetter}
                </div>

                <div className='flex-1 min-w-0'>
                  <span className='text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 break-words'>
                    {option.answerText}
                  </span>
                </div>

                {option.isCorrect && (
                  <div className='bg-green-500 text-white rounded-full p-1'>
                    <CheckCircle className='h-2.5 w-2.5 sm:h-3 sm:w-3' />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  // Main render function for question content
  function renderQuestionContent(
    activity: Activity,
    questionIndex: number,
    isActive: boolean
  ) {
    const questionType = getQuestionType(activity.activityType);

    // Get background from activity data with defaults
    const actualBackgroundImage = activity.backgroundImage || '';
    const actualBackgroundColor = activity.backgroundColor || '#FFFFFF';
    const hasBackgroundImage =
      actualBackgroundImage && actualBackgroundImage.trim() !== '';

    // Handle slide types with InfoSlideViewer
    const isSlideType =
      questionType === 'slide' || questionType === 'info_slide';

    if (isSlideType) {
      const slideTypeText =
        questionType === 'info_slide' ? 'Info Slide' : 'Slide';

      return (
        <Card
          className={cn(
            'border-none rounded-xl shadow-lg overflow-hidden transition-all duration-300 w-full',
            isActive
              ? 'ring-2 ring-primary/20 scale-100'
              : 'scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]'
          )}
        >
          <div className='flex flex-col items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 pb-6 sm:pb-8 pt-3 sm:pt-4 bg-gradient-to-br from-indigo-100/90 via-purple-100/80 to-blue-100/90 dark:from-indigo-900/90 dark:via-purple-900/80 dark:to-blue-900/95'>
            <div className='w-full flex justify-between mb-2 sm:mb-3'>
              <div className='flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300'></div>
              <motion.div
                className='flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className='h-3 w-3 sm:h-4 sm:w-4 text-white' />
                <span className='text-xs sm:text-sm font-medium text-white'>
                  {slideTypeText} {questionIndex + 1}
                </span>
              </motion.div>
            </div>

            <div className='flex-1 w-full flex items-center justify-center'>
              {/* Use InfoSlideViewer for slide rendering */}
              <div className='w-full max-w-full'>
                <InfoSlideViewer
                  activity={{
                    activityId: activity.activityId,
                    activityType: activity.activityType,
                    title: activity.title,
                    description: activity.description,
                    isPublished: activity.isPublished,
                    orderIndex: activity.orderIndex,
                    backgroundColor: actualBackgroundColor,
                    backgroundImage: actualBackgroundImage || null,
                    customBackgroundMusic:
                      activity.customBackgroundMusic || null,
                    slide: activity.slide || {
                      slideId: activity.activityId,
                      transitionEffect: null,
                      transitionDuration: 1.0,
                      autoAdvanceSeconds: 0,
                      slideElements: [],
                    },
                  }}
                  width={
                    viewMode === 'mobile'
                      ? 360
                      : viewMode === 'tablet'
                      ? 600
                      : 900
                  }
                  height={
                    viewMode === 'mobile'
                      ? 203
                      : viewMode === 'tablet'
                      ? 338
                      : 510
                  }
                  showAllElements={true}
                />
              </div>
            </div>
          </div>
        </Card>
      );
    }

    // Common question header component
    const QuestionHeader = () => (
      <motion.div
        className={cn(
          'aspect-[16/5] sm:aspect-[16/4] lg:aspect-[16/5] rounded-t-xl flex flex-col shadow-md relative overflow-hidden',
          hasBackgroundImage && 'bg-cover bg-center'
        )}
        style={{
          backgroundImage: hasBackgroundImage
            ? `url(${actualBackgroundImage})`
            : undefined,
          backgroundColor: actualBackgroundColor,
        }}
        initial={{ opacity: 0.8 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Light overlay */}
        <div className='absolute inset-0 bg-black/30' />

        {/* Status Bar */}
        <div className='absolute top-0 left-0 right-0 h-10 sm:h-12 bg-black/40 flex items-center justify-between px-2 sm:px-3 lg:px-5 text-white z-10'>
          <div className='flex items-center gap-1 sm:gap-2 lg:gap-3 min-w-0'>
            <div
              className={cn(
                'h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 rounded-full flex items-center justify-center shadow-sm flex-shrink-0',
                getQuestionTypeColor(questionType)
              )}
            >
              {getQuestionTypeIcon(questionType)}
            </div>
            <div className='min-w-0'>
              <div className='text-xs capitalize font-medium truncate'>
                {getQuestionTypeDisplayName(questionType)}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-1 sm:gap-2 flex-shrink-0'>
            <div className='flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs font-medium'>
              Q{questionIndex + 1}
            </div>
            <div className='flex items-center gap-1 sm:gap-1.5 bg-primary px-2 py-1 rounded-full text-xs font-medium'>
              <Clock className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
              <span>{activity.quiz?.timeLimitSeconds || 30}s</span>
            </div>
          </div>
        </div>

        {/* Question Text */}
        <div className='flex-1 flex flex-col items-center justify-center z-10 py-3 sm:py-4 lg:py-6 px-3 sm:px-4 lg:px-5'>
          <h2 className='text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-center text-white drop-shadow-sm px-2 break-words w-full'>
            {activity.quiz?.questionText ||
              activity.title ||
              `Question ${questionIndex + 1}`}
          </h2>
          {/* {activity.description && (
            <p className='mt-2 text-xs sm:text-sm text-white/80 text-center px-2 break-words w-full'>
              {activity.description}
            </p>
          )} */}
        </div>

        {/* Image Attribution */}
        {hasBackgroundImage && (
          <div className='absolute bottom-2 right-2'>
            <Button
              variant='ghost'
              size='icon'
              className='h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-black/40 hover:bg-black/50 text-white'
            >
              <Image className='h-3 w-3' />
            </Button>
          </div>
        )}
      </motion.div>
    );

    // Handle location questions - Question text first, then map
    if (questionType === 'location') {
      return (
        <Card
          className={cn(
            'border-none rounded-xl shadow-lg overflow-hidden transition-all duration-300 w-full',
            isActive
              ? 'ring-2 ring-primary/20 scale-100'
              : 'scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]'
          )}
          key={`question-card-${questionIndex}`}
        >
          <QuestionHeader />
          <CardContent className='p-3 sm:p-6 bg-white dark:bg-gray-800'>
            <LocationMapComponent activity={activity} />
          </CardContent>
        </Card>
      );
    }

    // Handle matching pairs - Question text first, then matching area
    if (questionType === 'matching_pair') {
      return (
        <Card
          className={cn(
            'border-none rounded-xl shadow-lg overflow-hidden transition-all duration-300 w-full',
            isActive
              ? 'ring-2 ring-primary/20 scale-100'
              : 'scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]'
          )}
          key={`question-card-${questionIndex}`}
        >
          <QuestionHeader />
          <CardContent className='p-0 bg-white dark:bg-gray-800'>
            <MatchingPairsComponent activity={activity} />
          </CardContent>
        </Card>
      );
    }

    // Main question card layout for all other quiz types
    return (
      <Card
        className={cn(
          'border-none rounded-xl shadow-lg overflow-hidden transition-all duration-300 w-full',
          isActive
            ? 'ring-2 ring-primary/20 scale-100'
            : 'scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]'
        )}
        key={`question-card-${questionIndex}`}
      >
        <QuestionHeader />

        {/* Quiz Options */}
        <CardContent className='p-3 sm:p-4 bg-white dark:bg-gray-800'>
          {renderQuizOptions(activity, questionType)}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className='w-full max-w-4xl mx-auto'>
        <CardContent className='p-12 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-4'
          >
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto'>
              <BookOpen className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-700'>
              Không có hoạt động nào
            </h3>
            <p className='text-gray-500'>
              Collection này chưa có hoạt động nào được thêm vào.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-hidden',
          isFullscreen && 'fixed inset-0 z-50'
        )}
      >
        {/* Enhanced Control Header */}
        <AnimatePresence>
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            className='absolute top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700'
          >
            <div className='flex items-center justify-between px-2 sm:px-3 md:px-6 py-2 sm:py-3'>
              {/* Left Controls */}
              <div className='flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        setIsQuestionListCollapsed(!isQuestionListCollapsed)
                      }
                      className='h-8 w-8 p-0 flex-shrink-0'
                    >
                      {isQuestionListCollapsed ? (
                        <List className='h-4 w-4' />
                      ) : (
                        <Grid className='h-4 w-4' />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isQuestionListCollapsed
                      ? 'Hiện danh sách'
                      : 'Ẩn danh sách'}
                  </TooltipContent>
                </Tooltip>

                <div className='hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600' />

                {/* Progress Info */}
                <div className='flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0'>
                  <div className='text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap'>
                    {currentIndex + 1}/{totalQuestions}
                  </div>
                  <div className='w-12 sm:w-16 md:w-32'>
                    <Progress
                      value={completionPercentage}
                      className='h-1.5 sm:h-2'
                    />
                  </div>
                  <div className='hidden md:block text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                    {Math.round(completionPercentage)}%
                  </div>
                </div>
              </div>

              {/* Center - Collection Title */}
              <div className='absolute left-1/2 transform -translate-x-1/2 hidden lg:block max-w-48 xl:max-w-64'>
                <h1 className='text-sm xl:text-lg font-semibold text-gray-800 dark:text-gray-200 truncate'>
                  {collectionTitle}
                </h1>
              </div>

              {/* Right Controls */}
              <div className='flex items-center gap-1 sm:gap-2 flex-shrink-0'>
                {/* View Mode Tabs - Hide on small screens */}
                <div className='hidden lg:block'>
                  <Tabs
                    value={viewMode}
                    onValueChange={(value: any) => setViewMode(value)}
                    className='h-8'
                  >
                    <TabsList className='h-8 py-1 bg-gray-100 dark:bg-gray-800'>
                      <TabsTrigger
                        value='mobile'
                        className='h-6 w-8 px-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700'
                      >
                        <Smartphone className='h-3 w-3' />
                      </TabsTrigger>
                      <TabsTrigger
                        value='tablet'
                        className='h-6 w-8 px-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700'
                      >
                        <Tablet className='h-3 w-3' />
                      </TabsTrigger>
                      <TabsTrigger
                        value='desktop'
                        className='h-6 w-8 px-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700'
                      >
                        <Monitor className='h-3 w-3' />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className='hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600' />

                {/* Additional Controls */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                      <Settings className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-56'>
                    <div className='p-2'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium'>Hiện đáp án</span>
                        <Switch
                          checked={showAnswers}
                          onCheckedChange={setShowAnswers}
                        />
                      </div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium'>Âm thanh</span>
                        <Switch
                          checked={soundEnabled}
                          onCheckedChange={setSoundEnabled}
                        />
                      </div>
                      {/* Show view mode options on mobile */}
                      <div className='lg:hidden border-t pt-2 mt-2'>
                        <div className='text-sm font-medium mb-2'>
                          Chế độ xem
                        </div>
                        <div className='space-y-1'>
                          {[
                            {
                              value: 'mobile',
                              label: 'Mobile',
                              icon: Smartphone,
                            },
                            { value: 'tablet', label: 'Tablet', icon: Tablet },
                            {
                              value: 'desktop',
                              label: 'Desktop',
                              icon: Monitor,
                            },
                          ].map(({ value, label, icon: Icon }) => (
                            <button
                              key={value}
                              onClick={() => setViewMode(value as any)}
                              className={cn(
                                'w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors',
                                viewMode === value
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              )}
                            >
                              <Icon className='h-4 w-4' />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={toggleFullscreen}
                      className='h-8 w-8 p-0'
                    >
                      <Fullscreen className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toàn màn hình (F)</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Sidebar */}
        <AnimatePresence>
          {!isQuestionListCollapsed && (
            <>
              {/* Mobile Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='sm:hidden fixed inset-0 bg-black/50 z-30'
                onClick={() => setIsQuestionListCollapsed(true)}
                style={{ marginTop: '60px' }}
              />

              {/* Sidebar */}
              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={cn(
                  'bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 flex flex-col z-40',
                  'w-72 sm:w-80', // Responsive width
                  'fixed sm:relative', // Fixed on mobile, relative on larger screens
                  'h-full'
                )}
                style={{ marginTop: '60px' }}
              >
                <ScrollArea className='flex-1'>
                  <div className='p-3 sm:p-4'>
                    <div className='mb-4'>
                      <h2 className='text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1'>
                        Danh sách câu hỏi
                      </h2>
                      <div className='flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400'>
                        <span>{totalQuestions} hoạt động</span>
                        <span>•</span>
                        <span>~{formatTime(estimatedTimeRemaining)}</span>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      {sortedActivities.map((activity, index) => {
                        const questionType = getQuestionType(
                          activity.activityType
                        );
                        const isActive = currentIndex === index;

                        return (
                          <motion.div
                            key={activity.activityId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              'p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 border-2',
                              isActive
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-700 shadow-lg ring-2 ring-blue-100 dark:ring-blue-800'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                            )}
                            onClick={() => {
                              goToQuestion(index);
                              // Auto close sidebar on mobile after selection
                              if (window.innerWidth < 640) {
                                setIsQuestionListCollapsed(true);
                              }
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className='flex items-center gap-2 sm:gap-3'>
                              <div
                                className={cn(
                                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-md bg-gradient-to-br flex-shrink-0',
                                  getQuestionTypeColor(questionType)
                                )}
                              >
                                {index + 1}
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2'>
                                  <div className='flex items-center gap-1'>
                                    {getQuestionTypeIcon(questionType)}
                                    <Badge
                                      variant='secondary'
                                      className={cn(
                                        'text-xs font-medium',
                                        isActive &&
                                          'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                                      )}
                                    >
                                      {getQuestionTypeDisplayName(questionType)}
                                    </Badge>
                                  </div>
                                  {isActive && (
                                    <div className='flex items-center gap-1'>
                                      <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse' />
                                      <span className='text-xs text-blue-600 dark:text-blue-400 font-medium'>
                                        Đang xem
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <p
                                  className={cn(
                                    'text-xs sm:text-sm font-medium truncate mb-1',
                                    isActive
                                      ? 'text-gray-900 dark:text-white'
                                      : 'text-gray-700 dark:text-gray-300'
                                  )}
                                >
                                  {activity.quiz?.questionText ||
                                    activity.title ||
                                    `Hoạt động ${index + 1}`}
                                </p>
                                {activity.quiz?.timeLimitSeconds && (
                                  <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                                    <Clock className='h-3 w-3' />
                                    <span>
                                      {formatTime(
                                        activity.quiz.timeLimitSeconds
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content - Changed to scrollable list */}
        <div
          className='flex-1 flex flex-col overflow-hidden'
          style={{ marginTop: '60px' }}
        >
          <div className='flex-1 overflow-hidden'>
            <div
              className={cn(
                'h-full transition-all duration-300',
                // Auto responsive based on screen size, override with viewMode
                'w-full max-w-none',
                viewMode === 'mobile' && 'max-w-full',
                viewMode === 'tablet' && 'max-w-full',
                viewMode === 'desktop' && 'max-w-full'
              )}
            >
              <ScrollArea className='h-full' ref={scrollContainerRef}>
                <div className='p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8 pb-20 sm:pb-6'>
                  {sortedActivities.map((activity, index) => (
                    <motion.div
                      key={activity.activityId}
                      id={`question-${index}`}
                      ref={(el) => (questionRefs.current[index] = el)}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className='scroll-mt-20'
                    >
                      <div
                        className={cn(
                          'w-full mx-auto',
                          viewMode === 'mobile' && 'max-w-sm',
                          viewMode === 'tablet' && 'max-w-2xl lg:max-w-4xl',
                          viewMode === 'desktop' && 'max-w-5xl'
                        )}
                      >
                        {renderQuestionContent(
                          activity,
                          index,
                          currentIndex === index
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Controls */}
        <div className='sm:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'>
          <div className='flex items-center gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-gray-200 dark:border-gray-700'>
            <Button
              variant='ghost'
              size='sm'
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className='h-8 w-8 p-0 rounded-full'
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>

            <div className='text-xs font-medium text-gray-700 dark:text-gray-300 px-2'>
              {currentIndex + 1} / {totalQuestions}
            </div>

            <Button
              variant='ghost'
              size='sm'
              onClick={goToNext}
              disabled={currentIndex === totalQuestions - 1}
              className='h-8 w-8 p-0 rounded-full'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
