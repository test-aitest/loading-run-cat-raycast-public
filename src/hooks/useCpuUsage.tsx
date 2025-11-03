import { useEffect, useState } from "react";
import { getCpuTimes } from "../utils/util";

export interface CpuUsageInfo {
  total: number;
  system: number;
  user: number;
  idle: number;
}

export const useCpuUsage = (intervalMs: number = 1000) => {
  const [cpuUsage, setCpuUsage] = useState<number | null>(null);
  const [cpuUsageInfo, setCpuUsageInfo] = useState<CpuUsageInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let previousTimes = getCpuTimes();

    const interval = setInterval(() => {
      const currentTimes = getCpuTimes();

      const idleDiff = currentTimes.idle - previousTimes.idle;
      const totalDiff = currentTimes.total - previousTimes.total;
      const userDiff = currentTimes.user - previousTimes.user;
      const systemDiff = currentTimes.system - previousTimes.system;

      const usage = 100 - (100 * idleDiff) / totalDiff;
      const systemUsage = (100 * systemDiff) / totalDiff;
      const userUsage = (100 * userDiff) / totalDiff;
      const idleUsage = (100 * idleDiff) / totalDiff;

      setCpuUsage(Math.round(usage * 10) / 10);
      setCpuUsageInfo({
        total: Math.round(usage * 10) / 10,
        system: Math.round(systemUsage * 10) / 10,
        user: Math.round(userUsage * 10) / 10,
        idle: Math.round(idleUsage * 10) / 10,
      });
      setLoading(false);

      previousTimes = currentTimes;
    }, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [intervalMs]);

  return {
    cpuUsage,
    cpuUsageInfo,
    loading,
  };
};
