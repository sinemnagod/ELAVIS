export interface VehicleTelemetry {
  tireFL: number;
  tireFR: number;
  tireRL: number;
  tireRR: number;
  battery12v: number;
  avgConsumption: number;
  odometer: number;
  chargeHistoryPath: string;
  rangeFactor: number;
}

export const vehicleTelemetry: Record<string, VehicleTelemetry> = {
  vector: {
    tireFL: 2.4,
    tireFR: 2.4,
    tireRL: 2.3,
    tireRR: 2.3,
    battery12v: 98,
    avgConsumption: 16.4,
    odometer: 14285,
    chargeHistoryPath: "M 0,80 C 30,80 40,30 70,30 C 100,30 110,70 140,70 C 170,70 180,20 200,20",
    rangeFactor: 6.2
  },
  cloud: {
    tireFL: 2.3,
    tireFR: 2.3,
    tireRL: 2.2,
    tireRR: 2.2,
    battery12v: 95,
    avgConsumption: 14.8,
    odometer: 8940,
    chargeHistoryPath: "M 0,90 C 20,80 50,50 80,50 C 110,50 120,80 150,80 C 170,80 190,40 200,30",
    rangeFactor: 5.8
  },
  bullet: {
    tireFL: 2.6,
    tireFR: 2.6,
    tireRL: 2.5,
    tireRR: 2.5,
    battery12v: 99,
    avgConsumption: 19.2,
    odometer: 23150,
    chargeHistoryPath: "M 0,60 C 40,70 60,20 90,20 C 120,20 130,60 160,60 C 180,60 190,10 200,10",
    rangeFactor: 2.0
  }
};

export const defaultVehicleTelemetry = vehicleTelemetry.vector;
