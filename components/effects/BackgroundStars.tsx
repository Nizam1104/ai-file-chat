"use client"

import { useEffect, useState } from 'react'

// Star component for twinkling animation
const Star = ({ delay, duration, top, left, size }: { delay: number; duration: number; top: number; left: number; size: number }) => (
  <div
    className="absolute bg-white rounded-full"
    style={{
      top: `${top}%`,
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      animation: `twinkle ${duration}s ease-in-out ${delay}s infinite`,
    }}
  />
)

export default function BackgroundStars() {
  const [stars, setStars] = useState<Array<{id: number; delay: number; duration: number; top: number; left: number; size: number}>>([])

  useEffect(() => {
    // Generate random stars
    const generateStars = () => {
      const newStars = []
      for (let i = 0; i < 100; i++) {
        newStars.push({
          id: i,
          delay: Math.random() * 3,
          duration: 2 + Math.random() * 3,
          top: Math.random() * 100,
          left: Math.random() * 100,
          size: Math.random() * 2 + 0.5 // Random size between 0.5px and 2.5px
        })
      }
      setStars(newStars)
    }

    generateStars()
  }, [])

  return (
    <>
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>

      <div className="absolute inset-0 bg-black pointer-events-none">
        {stars.map(star => (
          <Star
            key={star.id}
            delay={star.delay}
            duration={star.duration}
            top={star.top}
            left={star.left}
            size={star.size}
          />
        ))}
      </div>
    </>
  )
}
