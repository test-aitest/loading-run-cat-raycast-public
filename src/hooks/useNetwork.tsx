import { useEffect, useState, useRef } from "react";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface NetworkInfo {
  interfaceName: string;
  localIP: string;
  upload: number; // KB/s
  download: number; // KB/s
}

export const useNetwork = (intervalMs: number = 2000) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const previousStats = useRef<{ bytesIn: number; bytesOut: number; time: number } | null>(null);

  useEffect(() => {
    const updateNetwork = async () => {
      try {
        // Get local IP address
        const interfaces = os.networkInterfaces();
        let localIP = "";
        let interfaceName = "Unknown";
        let activeInterface = "en0"; // Default to en0

        // Find active network interface
        for (const [name, addresses] of Object.entries(interfaces)) {
          if (addresses) {
            for (const addr of addresses) {
              // Skip internal and IPv6 addresses
              if (!addr.internal && addr.family === "IPv4") {
                localIP = addr.address;
                interfaceName = name.includes("en") ? "Wi-Fi" : name;
                activeInterface = name;
                break;
              }
            }
          }
          if (localIP) break;
        }

        // Get network traffic stats using netstat -bdI for more accurate byte counts
        const { stdout } = await execAsync(`/usr/sbin/netstat -bdI ${activeInterface} | /usr/bin/tail -1`);
        const parts = stdout.trim().split(/\s+/);

        if (parts.length >= 10) {
          // netstat -bdI format: Name Mtu Network Address Ipkts Ierrs Ibytes Opkts Oerrs Obytes Coll Drop
          const bytesIn = parseInt(parts[6]); // Ibytes (download)
          const bytesOut = parseInt(parts[9]); // Obytes (upload)
          const currentTime = Date.now();

          let upload = 0;
          let download = 0;

          if (previousStats.current) {
            const timeDiff = (currentTime - previousStats.current.time) / 1000; // seconds
            const bytesInDiff = bytesIn - previousStats.current.bytesIn;
            const bytesOutDiff = bytesOut - previousStats.current.bytesOut;

            download = bytesInDiff / timeDiff / 1024; // KB/s
            upload = bytesOutDiff / timeDiff / 1024; // KB/s
          }

          previousStats.current = {
            bytesIn,
            bytesOut,
            time: currentTime,
          };

          setNetworkInfo({
            interfaceName,
            localIP,
            upload: Math.max(0, Math.round(upload * 10) / 10), // Ensure non-negative
            download: Math.max(0, Math.round(download * 10) / 10), // Ensure non-negative
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to get network info:", error);
        setLoading(false);
      }
    };

    updateNetwork();

    const interval = setInterval(updateNetwork, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [intervalMs]);

  return {
    networkInfo,
    loading,
  };
};
