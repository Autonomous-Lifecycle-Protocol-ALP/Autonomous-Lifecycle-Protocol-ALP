import { HardwareDevice, HardwareSensor } from "../types";

export class HardwarePlanningEngine {
  private devices: Map<string, HardwareDevice> = new Map();

  planDevice(device: Omit<HardwareDevice, "lastSeen">): HardwareDevice {
    const full: HardwareDevice = {
      ...device,
      lastSeen: new Date().toISOString(),
    };
    this.devices.set(full.id, full);
    return full;
  }

  addSensor(deviceId: string, sensor: Omit<HardwareSensor, "id">): HardwareSensor | undefined {
    const device = this.devices.get(deviceId);
    if (!device) return undefined;

    const s: HardwareSensor = {
      id: `${deviceId}-sensor-${device.sensors.length + 1}`,
      ...sensor,
    };
    device.sensors.push(s);
    return s;
  }

  getDevice(id: string): HardwareDevice | undefined {
    return this.devices.get(id);
  }

  listDevices(): HardwareDevice[] {
    return Array.from(this.devices.values());
  }

  listDevicesByVendor(vendor: string): HardwareDevice[] {
    return this.listDevices().filter((d) => d.vendor === vendor);
  }

  updateDeviceStatus(id: string, status: HardwareDevice["status"]): boolean {
    const device = this.devices.get(id);
    if (!device) return false;
    device.status = status;
    device.lastSeen = new Date().toISOString();
    return true;
  }
}
