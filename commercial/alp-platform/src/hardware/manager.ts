import { HardwareDevice, HardwareSensor } from "../types";

export class HardwareManager {
  private devices: Map<string, HardwareDevice> = new Map();

  register(device: Omit<HardwareDevice, "lastSeen">): HardwareDevice {
    const full: HardwareDevice = {
      ...device,
      lastSeen: new Date().toISOString(),
    };
    this.devices.set(full.id, full);
    return full;
  }

  unregister(id: string): boolean {
    return this.devices.delete(id);
  }

  getDevice(id: string): HardwareDevice | undefined {
    return this.devices.get(id);
  }

  listAll(): HardwareDevice[] {
    return Array.from(this.devices.values());
  }

  listByKind(kind: HardwareDevice["kind"]): HardwareDevice[] {
    return this.listAll().filter((d) => d.kind === kind);
  }

  listByStatus(status: HardwareDevice["status"]): HardwareDevice[] {
    return this.listAll().filter((d) => d.status === status);
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

  updateReading(deviceId: string, sensorId: string, value: number): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    const sensor = device.sensors.find((s: HardwareSensor) => s.id === sensorId);
    if (!sensor) return false;

    sensor.value = value;
    sensor.lastReadingAt = new Date().toISOString();
    device.lastSeen = new Date().toISOString();
    return true;
  }

  setStatus(id: string, status: HardwareDevice["status"]): boolean {
    const device = this.devices.get(id);
    if (!device) return false;
    device.status = status;
    device.lastSeen = new Date().toISOString();
    return true;
  }
}
