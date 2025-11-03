import * as os from "os";

interface CpuTimes {
  idle: number;
  total: number;
  user: number;
  system: number;
  nice: number;
  irq: number;
}

export function getCpuTimes(): CpuTimes {
  const cpus = os.cpus();
  let idle = 0;
  let user = 0;
  let system = 0;
  let nice = 0;
  let irq = 0;
  let total = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    idle += cpu.times.idle;
    user += cpu.times.user;
    system += cpu.times.sys;
    nice += cpu.times.nice;
    irq += cpu.times.irq;
  });

  return { idle, total, user, system, nice, irq };
}
