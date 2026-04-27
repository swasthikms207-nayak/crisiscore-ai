import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react'; // Ensure this matches your package (motion or framer-motion)
import { ChevronRight, Check } from 'lucide-react';

interface SlideButtonProps {
  onSuccess: () => void;
  disabled?: boolean;
  activeDisaster?: boolean;
}

export default function SlideButton({ onSuccess, disabled, activeDisaster }: SlideButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // FIX: Threshold should be slightly lower for accessibility
  const threshold = 0.92; 

  const handleStart = () => {
    if (disabled || !activeDisaster || isSuccess) return;
    setIsDragging(true);
  };

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !containerRef.current || isSuccess) return;

    const rect = containerRef.current.getBoundingClientRect();
    const handleWidth = 48; // w-12 is 48px
    const padding = 16; // px-2 is 8px + 8px
    const maxPath = rect.width - handleWidth - padding;
    
    // Calculate relative X
    let currentX = clientX - rect.left - handleWidth / 2;
    currentX = Math.max(0, Math.min(currentX, maxPath));
    
    const percentage = currentX / maxPath;
    setPosition(currentX);

    if (percentage >= threshold) {
      setIsDragging(false);
      setIsSuccess(true);
      setPosition(maxPath);
      
      // HACKATHON TIP: Shorter delay for "snappy" feeling
      setTimeout(() => {
        onSuccess();
      }, 600);
    }
  }, [isDragging, isSuccess, onSuccess]);

  const handleEnd = () => {
    if (!isDragging || isSuccess) return;
    setIsDragging(false);
    setPosition(0);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onMouseUp = handleEnd;
    const onTouchEnd = handleEnd;

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove]);

  // FIX: Percentage calculation for the progress bar
  const containerWidth = containerRef.current?.getBoundingClientRect().width || 400;
  const progress = position / (containerWidth - 64);

  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      <div 
        ref={containerRef}
        className={`relative h-16 w-full backdrop-blur-md rounded-full border transition-colors duration-500 flex items-center px-2 shadow-2xl overflow-hidden ${
          activeDisaster ? 'bg-white/5 border-white/10' : 'bg-black/40 border-white/5 grayscale'
        }`}
      >
        {/* Track Fill with SOS Glow */}
        <motion.div 
          className="absolute inset-y-0 left-0"
          initial={false}
          animate={{ 
            width: position + 48,
            opacity: progress > 0.05 ? 1 : 0 
          }}
          style={{ 
            background: 'linear-gradient(90deg, #FF4B2B 0%, #FF8C00 100%)',
            boxShadow: `0 0 ${progress * 30}px rgba(255, 75, 43, 0.6)`
          }}
        />

        {/* Tactical Labels */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            style={{ opacity: 1 - progress * 2, x: progress * 50 }}
            className="flex flex-col items-center"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-white/50">
              {activeDisaster ? 'Slide to Send SOS' : 'Select Hazard First'}
            </span>
          </motion.div>
        </div>

        {/* Handle */}
        <motion.div
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          animate={{
            x: position,
            scale: isDragging ? 0.9 : 1,
          }}
          transition={isSuccess ? { type: 'spring', stiffness: 500, damping: 20 } : { type: 'tween', ease: "easeOut", duration: 0.1 }}
          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-20 transition-all relative ${
            isSuccess 
              ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,1)]' 
              : activeDisaster 
                ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF8C00] shadow-lg' 
                : 'bg-gray-700'
          }`}
        >
          {isSuccess ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <ChevronRight className={`w-6 h-6 text-white transition-opacity ${!activeDisaster ? 'opacity-20' : 'opacity-100'}`} />
          )}
        </motion.div>

        {/* Success Flash */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0] }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="mt-3 flex justify-between px-3 opacity-60">
        <div className="flex flex-col">
          <span className="text-[6px] font-mono text-white/50 uppercase tracking-tighter">Uplink</span>
          <span className={`text-[8px] font-bold ${activeDisaster ? 'text-green-500' : 'text-red-500'}`}>
            {activeDisaster ? 'ENCRYPTED' : 'OFFLINE'}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[6px] font-mono text-white/50 uppercase tracking-tighter">Priority</span>
          <span className="text-[8px] font-bold text-white">MAX_LEVEL</span>
        </div>
      </div>
    </div>
  );
}
