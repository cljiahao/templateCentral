'use client';

import { cn } from '@/lib/utils';
import {
  motion,
  type TargetAndTransition,
  type Transition,
} from 'framer-motion';
import Image from 'next/image';

interface FloatingShapeProps {
  src?: string;
  alt?: string;
  imageClassName?: string;
  className?: string;
  animate?: TargetAndTransition;
  transition?: Transition;
}

export function FloatingShape({
  src = '/image_assets/default-square.svg',
  alt = 'default-square',
  imageClassName,
  className,
  animate = { y: [0, -15, 0], rotate: [0, 5, 0] },
  transition = { duration: 10, repeat: Infinity, ease: 'easeInOut' },
}: FloatingShapeProps) {
  return (
    <motion.div
      animate={animate}
      transition={transition}
      className={cn(
        className,
        'pointer-events-none absolute hidden opacity-80 xl:block'
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(imageClassName, 'object-contain')}
      />
    </motion.div>
  );
}
