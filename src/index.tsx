import { MenuBarExtra, Image, environment, LaunchType, Icon } from "@raycast/api";
import { useEffect } from "react";
import { useCpuUsage } from "./hooks/useCpuUsage";
import { useMemory } from "./hooks/useMemory";
import { useStorage } from "./hooks/useStorage";
import { useBattery } from "./hooks/useBattery";
import { useNetwork } from "./hooks/useNetwork";
import { useRuncatAnimation } from "./hooks/useRuncatAnimation";

export default function Command() {
  const { cpuUsage, cpuUsageInfo } = useCpuUsage();
  const { memoryInfo } = useMemory();
  const { storageInfo } = useStorage();
  const { batteryInfo } = useBattery();
  const { networkInfo } = useNetwork();
  const runcatIcon = useRuncatAnimation(cpuUsage);

  useEffect(() => {
    if (environment.launchType === LaunchType.UserInitiated) {
      console.log("Command launched by user");
    } else if (environment.launchType === LaunchType.Background) {
      console.log("Command launched by background refresh");
    }
  }, [environment.launchType]);

  const iconConfig: Image.ImageLike = {
    source: runcatIcon,
    mask: Image.Mask.RoundedRectangle,
  };

  return (
    <MenuBarExtra icon={iconConfig} tooltip={`CPU Usage: ${cpuUsage ?? "Loading..."}%`}>
      <MenuBarExtra.Item title="Runcat" icon={iconConfig} />

      {/* CPU情報 */}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item icon={Icon.MemoryChip} title={`CPU: ${cpuUsage ?? "..."}%`} />
        {cpuUsageInfo && (
          <>
            <MenuBarExtra.Item title={`  システム: ${cpuUsageInfo.system}%`} />
            <MenuBarExtra.Item title={`  ユーザ: ${cpuUsageInfo.user}%`} />
            <MenuBarExtra.Item title={`  アイドル状態: ${cpuUsageInfo.idle}%`} />
          </>
        )}
      </MenuBarExtra.Section>

      {/* メモリ情報 */}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          icon={Icon.MemoryStick}
          title={`メモリ: ${memoryInfo ? memoryInfo.percentage.toFixed(1) : "..."}%`}
        />
        {memoryInfo && (
          <>
            <MenuBarExtra.Item title={`  プレッシャー: ${memoryInfo.pressure.toFixed(1)}%`} />
            <MenuBarExtra.Item title={`  アプリメモリ: ${memoryInfo.appMemory.toFixed(1)} GB`} />
            <MenuBarExtra.Item title={`  確保されているメモリ: ${memoryInfo.wired.toFixed(1)} GB`} />
            <MenuBarExtra.Item title={`  圧縮: ${memoryInfo.compressed.toFixed(1)} GB`} />
          </>
        )}
      </MenuBarExtra.Section>

      {/* ストレージ情報 */}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          icon={Icon.HardDrive}
          title={`ストレージ: ${storageInfo ? storageInfo.percentage.toFixed(1) : "..."}% 使用中`}
        />
        {storageInfo && (
          <>
            <MenuBarExtra.Item title={`  ${storageInfo.used.toFixed(2)} GB / ${storageInfo.total.toFixed(2)} GB`} />
            <MenuBarExtra.Item title={`  空き: ${storageInfo.available.toFixed(2)} GB`} />
          </>
        )}
      </MenuBarExtra.Section>

      {/* バッテリー情報 */}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item icon={Icon.Battery} title={`バッテリー: ${batteryInfo ? batteryInfo.percentage : "..."}%`} />
        {batteryInfo && (
          <>
            <MenuBarExtra.Item title={`  供給源: ${batteryInfo.source}`} />
            {batteryInfo.maxCapacity !== null && (
              <MenuBarExtra.Item title={`  最大容量: ${batteryInfo.maxCapacity}%`} />
            )}
            {batteryInfo.cycleCount !== null && <MenuBarExtra.Item title={`  充放電回数: ${batteryInfo.cycleCount}`} />}
            {batteryInfo.temperature !== null && (
              <MenuBarExtra.Item title={`  温度: ${batteryInfo.temperature.toFixed(1)}°C`} />
            )}
          </>
        )}
      </MenuBarExtra.Section>

      {/* ネットワーク情報 */}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          icon={Icon.Globe}
          title={`ネットワーク: ${networkInfo ? networkInfo.interfaceName : "..."}`}
        />
        {networkInfo && (
          <>
            <MenuBarExtra.Item title={`  ローカル IP: ${networkInfo.localIP}`} />
            <MenuBarExtra.Item title={`  アップロード: ${networkInfo.upload} KB/s`} />
            <MenuBarExtra.Item title={`  ダウンロード: ${networkInfo.download} KB/s`} />
          </>
        )}
      </MenuBarExtra.Section>

      {/* キャラクターコメント表示
      {selectedCharacter ? (
        <MenuBarExtra.Section title="💬 Character Message">
          <MenuBarExtra.Item title={characterComment} />
        </MenuBarExtra.Section>
      ) : (
        <MenuBarExtra.Section title="💬 Character Message">
          <MenuBarExtra.Item title="No Character Selected" />
        </MenuBarExtra.Section>
      )} */}
    </MenuBarExtra>
  );
}
