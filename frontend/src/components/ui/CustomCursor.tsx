import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

/**
 * CustomCursor:
 * Subtle ring that tracks cursor, expanding over interactive elements.
 * Automatically disabled on touch screens and prefers-reduced-motion.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [clicked, setClicked] = useState(false);

  const cursorX = useSpring(0, { stiffness: 450, damping: 28 });
  const cursorY = useSpring(0, { stiffness: 450, damping: 28 });

  useEffect(() => {
    // Check touch device or reduced motion
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'a, button, input, textarea, select, [role="button"], .cursor-pointer',
        );
        setIsPointer(!!interactive);
      }
    };

    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [cursorX, cursorY]);

  if (!enabled) return null;

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full border border-[#6542C5] dark:border-[#B59AF7]"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
        width: isPointer ? 38 : 22,
        height: isPointer ? 38 : 22,
        backgroundColor: isPointer ? 'rgba(101, 66, 197, 0.1)' : 'transparent',
        scale: clicked ? 0.85 : 1,
        transition: 'width 0.2s, height 0.2s, background-color 0.2s',
      }}
    />
  );
}

/**
 * AmbientBlob:
 * Soft ambient gradient blob that tracks mouse very slowly across background.
 */
export function AmbientBlob() {
  const [enabled, setEnabled] = useState(false);
  const blobX = useSpring(200, { stiffness: 40, damping: 25 });
  const blobY = useSpring(200, { stiffness: 40, damping: 25 });

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      blobX.set(e.clientX);
      blobY.set(e.clientY);
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [blobX, blobY]);

  if (!enabled) return null;

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 -z-10 h-96 w-96 rounded-full blur-3xl opacity-25 dark:opacity-15 bg-gradient-to-tr from-[#6542C5] via-[#B59AF7] to-[#F2B38C]"
      style={{
        x: blobX,
        y: blobY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    />
  );
}

