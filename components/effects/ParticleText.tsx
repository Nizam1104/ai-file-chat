import React, { useEffect, useRef } from 'react';

interface ParticleTextProps {
  text?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  fontSize?: number;
  particleSize?: number;
  particleColor?: string;
  animationSpeed?: number;
  particleSpacing?: number;
}

const ParticleTextCanvas = ({
  text = "File chat",
  canvasWidth = 800,
  canvasHeight = 300,
  fontSize = 180,
  particleSize = 2,
  particleColor = "#FFFFFF",
  animationSpeed = 0.05,
  particleSpacing = 5
}: ParticleTextProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  const particlesRef = useRef<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    };

    updateCanvasSize();

    class Particle {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      size: number;
      opacity: number;
      speed: number;
      hasReached: boolean;
      threshold: number;

      constructor(x: number, y: number, targetX: number, targetY: number) {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.targetX = targetX;
        this.targetY = targetY;
        this.size = particleSize;
        this.opacity = 1;
        this.speed = animationSpeed + Math.random() * 0.005;
        this.hasReached = false;
        this.threshold = 1;
      }

      update(): void {
        if (!this.hasReached) {
          // Move towards target position
          this.x += (this.targetX - this.x) * this.speed;
          this.y += (this.targetY - this.y) * this.speed;

          // Check if particle has reached its target position
          const distance = Math.sqrt(
            Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2)
          );

          if (distance < this.threshold) {
            this.hasReached = true;
            this.x = this.targetX;
            this.y = this.targetY;
          }
        }
      }

      draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const getTextPixels = (text: string) => {
      // Create a temporary canvas to get text pixels
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) return [];

      const effectiveFontSize = fontSize;
      tempCtx.font = `bold ${effectiveFontSize}px Arial`;
      const textMetrics = tempCtx.measureText(text);

      tempCanvas.width = textMetrics.width + 40;
      tempCanvas.height = effectiveFontSize + 20;

      // Redraw with proper size
      tempCtx.font = `bold ${effectiveFontSize}px Arial`;
      tempCtx.fillStyle = 'white';
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);

      // Get pixel data
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const pixels = imageData.data;
      const textPixels: { x: number; y: number }[] = [];

      // Sample pixels with consistent spacing to create uniform dot pattern
      const spacing = particleSpacing;
      for (let y = 0; y < tempCanvas.height; y += spacing) {
        for (let x = 0; x < tempCanvas.width; x += spacing) {
          const index = (y * tempCanvas.width + x) * 4;
          const alpha = pixels[index + 3];

          if (alpha > 100) {
            // Calculate position relative to canvas center
            const canvasCenterX = canvas.width / 2;
            const canvasCenterY = canvas.height / 2;
            const textCenterX = tempCanvas.width / 2;
            const textCenterY = tempCanvas.height / 2;

            const finalX = canvasCenterX + (x - textCenterX);
            const finalY = canvasCenterY + (y - textCenterY);

            textPixels.push({ x: finalX, y: finalY });
          }
        }
      }

      return textPixels;
    };

    const initParticles = (): void => {
      const textPixels = getTextPixels(text);
      particlesRef.current = [];

      // Create exactly one particle per text pixel position
      textPixels.forEach(pixel => {
        particlesRef.current.push(
          new Particle(0, 0, pixel.x, pixel.y)
        );
      });
    };

    const animate = (): void => {
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Check if all particles have reached their targets
      let allReached = true;

      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw(ctx);
        if (!particle.hasReached) {
          allReached = false;
        }
      });

      // Continue animation until all particles reach their targets
      if (!allReached) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Initialize and start animation
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    initParticles();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text, animationSpeed, canvasHeight, canvasWidth, fontSize, particleColor, particleSize, particleSpacing]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        className=""
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};

// Main particle text component for signin page
const ParticleText = (props: ParticleTextProps) => {
  return <ParticleTextCanvas {...props} />;
};

export default ParticleText;
