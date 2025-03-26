import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: string;
  delay?: number;
  duration?: number;
  offset?: number;
  easing?: string;
  once?: boolean;
}

export default function AnimatedSection({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  duration = 800,
  offset = 120,
  easing = 'ease-in-out',
  once = false,
}: AnimatedSectionProps) {
  return (
    <div
      className={cn(className)}
      data-aos={animation}
      data-aos-delay={delay}
      data-aos-duration={duration}
      data-aos-easing={easing}
      data-aos-offset={offset}
      data-aos-once={once}
    >
      {children}
    </div>
  );
}