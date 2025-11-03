import { useEffect, useState } from "react";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface StorageInfo {
  percentage: number;
  used: number;
  total: number;
  available: number;
}

export const useStorage = (intervalMs: number = 30000) => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const updateStorage = async () => {
      try {
        // Get APFS container info (same calculation as macOS Settings app)
        // macOS Settings shows: Total Capacity In Use - (System + Preboot + Recovery)
        const { stdout: apfsList } = await execAsync("/usr/sbin/diskutil apfs list | /usr/bin/grep -A 60 'Container disk3'");

        // Parse APFS container information
        const capacityInUseMatch = apfsList.match(/Capacity In Use By Volumes:\s+(\d+)\s+B/);
        const totalSizeMatch = apfsList.match(/Size \(Capacity Ceiling\):\s+(\d+)\s+B/);
        const freeSpaceMatch = apfsList.match(/Capacity Not Allocated:\s+(\d+)\s+B/);

        // Get all Capacity Consumed values
        const capacityConsumedMatches = apfsList.matchAll(/Capacity Consumed:\s+(\d+)\s+B/g);
        const capacityConsumed = Array.from(capacityConsumedMatches).map(m => parseInt(m[1]));

        if (capacityInUseMatch && totalSizeMatch && freeSpaceMatch && capacityConsumed.length >= 5) {
          const totalBytes = parseInt(totalSizeMatch[1]);
          const freeBytes = parseInt(freeSpaceMatch[1]);
          const capacityInUse = parseInt(capacityInUseMatch[1]);

          // Subtract system volumes (System, Preboot, Recovery) - indices 0, 1, 2
          const systemBytes = capacityConsumed[0];
          const prebootBytes = capacityConsumed[1];
          const recoveryBytes = capacityConsumed[2];

          const usedBytes = capacityInUse - systemBytes - prebootBytes - recoveryBytes;

          // Convert to GB (1 GB = 1,000,000,000 bytes for display)
          const total = totalBytes / 1_000_000_000;
          const available = freeBytes / 1_000_000_000;
          const used = usedBytes / 1_000_000_000;
          const percentage = (usedBytes / totalBytes) * 100;

          setStorageInfo({
            percentage,
            used,
            total,
            available,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to get storage info:", error);
        setLoading(false);
      }
    };

    updateStorage();

    const interval = setInterval(updateStorage, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [intervalMs]);

  return {
    storageInfo,
    loading,
  };
};
