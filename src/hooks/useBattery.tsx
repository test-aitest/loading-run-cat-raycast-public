import { useEffect, useState } from "react";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface BatteryInfo {
  percentage: number;
  isCharging: boolean;
  source: string;
  maxCapacity: number | null;
  cycleCount: number | null;
  temperature: number | null;
}

export const useBattery = (intervalMs: number = 10000) => {
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const updateBattery = async () => {
      try {
        // Get battery percentage and charging status
        const { stdout: pmsetOutput } = await execAsync("/usr/bin/pmset -g batt");

        // Parse battery percentage
        const percentMatch = pmsetOutput.match(/(\d+)%/);
        const percentage = percentMatch ? parseInt(percentMatch[1]) : 0;

        // Check if charging
        const isCharging = pmsetOutput.includes("AC Power");
        const source = isCharging ? "電源アダプタ" : "バッテリー";

        // Get additional battery info using ioreg
        const { stdout: ioregOutput } = await execAsync(
          "/usr/sbin/ioreg -r -c AppleSmartBattery | /usr/bin/grep -E 'MaxCapacity|CycleCount|Temperature'"
        );

        // Parse max capacity
        const maxCapMatch = ioregOutput.match(/"MaxCapacity"\s*=\s*(\d+)/);
        const designCapMatch = ioregOutput.match(/"DesignCapacity"\s*=\s*(\d+)/);
        let maxCapacity = null;
        if (maxCapMatch && designCapMatch) {
          const current = parseInt(maxCapMatch[1]);
          const design = parseInt(designCapMatch[1]);
          maxCapacity = Math.round((current / design) * 1000) / 10;
        }

        // Parse cycle count
        const cycleMatch = ioregOutput.match(/"CycleCount"\s*=\s*(\d+)/);
        const cycleCount = cycleMatch ? parseInt(cycleMatch[1]) : null;

        // Parse temperature (in hundredths of degrees Celsius)
        const tempMatch = ioregOutput.match(/"Temperature"\s*=\s*(\d+)/);
        const temperature = tempMatch ? parseInt(tempMatch[1]) / 100 : null;

        setBatteryInfo({
          percentage,
          isCharging,
          source,
          maxCapacity,
          cycleCount,
          temperature,
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to get battery info:", error);
        setLoading(false);
      }
    };

    updateBattery();

    const interval = setInterval(updateBattery, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [intervalMs]);

  return {
    batteryInfo,
    loading,
  };
};
