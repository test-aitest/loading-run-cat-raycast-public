import { useEffect, useState } from "react";

const FRAME_COUNT = 5; // 0.png to 4.png

/**
 * Calculate animation interval dynamically based on CPU usage
 * Uses inverse relationship: higher CPU = shorter interval (faster)
 */
const calculateInterval = (cpuUsage: number): number => {
  return 5000 / (cpuUsage + 50);
};

/**
 * Hook to animate runcat images based on CPU usage
 * Higher CPU load = faster animation
 * Lower CPU load = slower animation
 */
export const useRuncatAnimation = (cpuUsage: number | null) => {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    // Default to slow animation if CPU usage is not available
    const usage = cpuUsage ?? 0;

    // Calculate interval dynamically based on CPU usage
    const interval = calculateInterval(usage);

    const timer = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % FRAME_COUNT);
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [cpuUsage]);

  // Return the path to the current frame image
  return `runcat/small/${currentFrame}.png`;
};
