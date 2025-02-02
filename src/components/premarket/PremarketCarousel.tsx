import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PremarketCarouselProps {
  images: string[];
}

export function PremarketCarousel({ images }: PremarketCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (!images.length) return null;

  return (
    <div className="relative group">
      <div className="w-full h-[400px] rounded-xl overflow-hidden">
        <img
          src={images[currentIndex]}
          alt={`Chart ${currentIndex + 1}`}
          className="w-full h-full object-contain bg-gray-900"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-gray-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-trading-accent w-4'
                    : 'bg-gray-400 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}