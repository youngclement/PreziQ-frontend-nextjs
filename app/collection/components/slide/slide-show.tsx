'use client';

import React from 'react';
import Image from 'next/image';

export type SlideElement = {
  slideElementId: string;
  slideElementType: 'TEXT' | 'IMAGE';
  positionX: number; // %
  positionY: number; // %
  width: number; // %
  height: number; // %
  rotation: number; // deg
  layerOrder: number;
  content: string | null;
  sourceUrl: string | null;
};

export type Slide = {
  slideId: string;
  transitionEffect: string | null;
  transitionDuration: number;
  autoAdvanceSeconds: number;
  slideElements: SlideElement[];
};

export type Activity = {
  activityId: string;
  backgroundColor: string;
  backgroundImage: string | null;
  slide: Slide;
};

export type CollectionData = {
  collectionId: string;
  title: string;
  description: string;
  coverImage: string;
  activities: Activity[];
};

interface SlideShowProps {
  collection: CollectionData;
}

const SlideShow: React.FC<SlideShowProps> = ({ collection }) => (
  <div className="flex">
    {collection.activities.map((act) => {
      const { activityId, backgroundColor, backgroundImage, slide } = act;
      return (
        <section
          key={activityId}
          className="snap-start w-screen h-screen relative flex-shrink-0"
          style={{
            backgroundColor,
            backgroundImage: backgroundImage
              ? `url(${backgroundImage})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {slide.slideElements
            .sort((a, b) => a.layerOrder - b.layerOrder)
            .map((el) => {
              const wrapperStyle: React.CSSProperties = {
                position: 'absolute',
                left: `${el.positionX}%`,
                top: `${el.positionY}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                transform: `rotate(${el.rotation}deg)`,
              };

              if (el.slideElementType === 'TEXT' && el.content) {
                try {
                  const textProps = JSON.parse(el.content);
                  const textContent = textProps.text;
                  const baseStyles: React.CSSProperties = {
                    fontSize: `${textProps.fontSize}px`,
                    fontWeight: textProps.fontWeight,
                    fontFamily: textProps.fontFamily,
                    fontStyle: textProps.fontStyle,
                    color: textProps.fill,
                    textAlign: textProps.textAlign,
                    lineHeight: textProps.lineHeight,
                    letterSpacing: `${textProps.charSpacing}px`,
                    direction: textProps.direction,
                    backgroundColor:
                      textProps.textBackgroundColor || 'transparent',
                    opacity: textProps.opacity,
                  };

                  const stylesArray = textProps.styles || [];

                  // Sort styles by start index
                  stylesArray.sort((a: any, b: any) => a.start - b.start);

                  // Create segments
                  let segments: { start: number; end: number; style: any }[] =
                    [];
                  let currentIndex = 0;

                  stylesArray.forEach((styleEntry: any) => {
                    if (currentIndex < styleEntry.start) {
                      segments.push({
                        start: currentIndex,
                        end: styleEntry.start,
                        style: {},
                      });
                    }
                    segments.push({
                      start: styleEntry.start,
                      end: styleEntry.end,
                      style: styleEntry.style,
                    });
                    currentIndex = styleEntry.end;
                  });

                  if (currentIndex < textContent.length) {
                    segments.push({
                      start: currentIndex,
                      end: textContent.length,
                      style: {},
                    });
                  }

                  return (
                    <div
                      key={el.slideElementId}
                      className="whitespace-pre-wrap overflow-hidden"
                      style={{ ...wrapperStyle, ...baseStyles }}
                    >
                      {segments.map((segment, index) => {
                        const segmentText = textContent.slice(
                          segment.start,
                          segment.end
                        );
                        const segmentStyle: React.CSSProperties = {
                          ...baseStyles,
                          ...segment.style,
                          textDecoration:
                            [
                              segment.style.underline || textProps.underline
                                ? 'underline'
                                : '',
                              segment.style.overline || textProps.overline
                                ? 'overline'
                                : '',
                              segment.style.linethrough || textProps.linethrough
                                ? 'line-through'
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' ') || 'none',
                          fontSize: segment.style.fontSize
                            ? `${segment.style.fontSize}px`
                            : baseStyles.fontSize,
                          color: segment.style.fill || baseStyles.color,
                        };
                        return (
                          <span key={index} style={segmentStyle}>
                            {segmentText}
                          </span>
                        );
                      })}
                    </div>
                  );
                } catch (error) {
                  console.error('Failed to parse text content:', error);
                  return null;
                }
              }

              if (el.slideElementType === 'IMAGE' && el.sourceUrl) {
                return (
                  <div
                    key={el.slideElementId}
                    className="absolute"
                    style={wrapperStyle}
                  >
                    <Image
                      src={el.sourceUrl}
                      alt=""
                      fill
                      style={{ objectFit: 'contain' }}
                      priority
                    />
                  </div>
                );
              }

              return null;
            })}
        </section>
      );
    })}
  </div>
);

export default SlideShow;
