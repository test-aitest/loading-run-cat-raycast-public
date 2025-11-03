import { useEffect, useState } from "react";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface MemoryInfo {
  percentage: number;
  appMemory: number;
  wired: number;
  compressed: number;
  cached: number;
  pressure: number;
  total: number;
  free: number;
  used: number;
}

export const useMemory = (intervalMs: number = 2000) => {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const updateMemory = async () => {
      try {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();

        // Get detailed memory statistics from vm_stat
        const { stdout } = await execAsync("/usr/bin/vm_stat");

        // Parse vm_stat output
        const pageSize = parseInt(stdout.match(/page size of (\d+) bytes/)?.[1] || "16384");
        const parseLine = (pattern: RegExp) => {
          const match = stdout.match(pattern);
          return match ? parseInt(match[1].replace(/\./g, "")) : 0;
        };

        // const pagesFree = parseLine(/Pages free:\s+(\S+)/);
        const pagesActive = parseLine(/Pages active:\s+(\S+)/);
        const pagesInactive = parseLine(/Pages inactive:\s+(\S+)/);
        const pagesSpeculative = parseLine(/Pages speculative:\s+(\S+)/);
        const pagesWired = parseLine(/Pages wired down:\s+(\S+)/);
        const pagesOccupiedByCompressor = parseLine(/Pages occupied by compressor:\s+(\S+)/);
        const pagesPurgeable = parseLine(/Pages purgeable count:\s+(\S+)/);
        const pagesFileBacked = parseLine(/File-backed pages:\s+(\S+)/);

        // Convert pages to GB
        const toGB = (pages: number) => (pages * pageSize) / (1024 * 1024 * 1024);

        const wired = toGB(pagesWired);
        const compressed = toGB(pagesOccupiedByCompressor);
        const appMemory = toGB(pagesActive + pagesInactive + pagesSpeculative - pagesFileBacked - pagesPurgeable);
        const cached = toGB(pagesFileBacked + pagesPurgeable);
        const totalGB = totalMemory / (1024 * 1024 * 1024);
        const freeGB = freeMemory / (1024 * 1024 * 1024);
        const usedGB = totalGB - freeGB;

        // Memory usage percentage: (App Memory + Wired + Compressed) / Total
        const percentage = ((appMemory + wired + compressed) / totalGB) * 100;

        // Memory pressure: (Wired + Compressed) / Total
        const pressure = ((wired + compressed) / totalGB) * 100;

        setMemoryInfo({
          percentage: Math.round(percentage * 10) / 10,
          appMemory: Math.round(appMemory * 10) / 10,
          wired: Math.round(wired * 10) / 10,
          compressed: Math.round(compressed * 10) / 10,
          cached: Math.round(cached * 10) / 10,
          pressure: Math.round(pressure * 10) / 10,
          total: totalGB,
          free: freeGB,
          used: usedGB,
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to get memory info:", error);
        setLoading(false);
      }
    };

    updateMemory();

    const interval = setInterval(updateMemory, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [intervalMs]);

  return {
    memoryInfo,
    loading,
  };
};
