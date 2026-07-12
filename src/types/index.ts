export interface Vehicle {
  id: string;
  slug: string;
  name: string;
  type: string;
  tagline: string;
  description: string;
  image: string;
  detailImage: string;
  specs: {
    range: string;
    maxPower: string;
    acceleration: string;
    topSpeed: string;
    extraLabel?: string; // e.g. "Seats" or "Weight"
    extraValue?: string; // e.g. "7 Seats" or "140 kg"
  };
  features: {
    title: string;
    description: string;
  }[];
  gallery?: {
    title: string;
    path: string;
  }[];
  batteryPercent?: number;
  status?: "parked" | "charging" | "disconnected";
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceUSD: number;
  priceTRY: number;
  shortDescription: string;
  fullDescription: string;
  image: string;
  images?: string[];
  stock: number;
  featured: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  power: string; // e.g. "250 kW"
  availablePorts: number;
  totalPorts: number;
  status: "active" | "maintenance";
  type: "AC" | "DC";
  connector: "CCS2" | "Type 2" | "NACS";
}

export interface FavoriteStation {
  userId: string;
  stationId: string;
  createdAt: string;
}

export interface StationReservation {
  id: string;
  userId: string;
  stationId: string;
  vehicleId: string;
  status: "active" | "completed" | "cancelled";
  reservedAt: string;
  expiresAt: string;
}

export interface ChargingSchedule {
  id: string;
  userId: string;
  vehicleId: string;
  stationId?: string;
  mode: "home" | "station";
  departureTime: string;
  days: string[];
  precondition: boolean;
  limit: number;
  active: boolean;
  createdAt: string;
}

export interface VehicleSettings {
  userId: string;
  vehicleId: string;
  chargeLimit: number;
  precondition: boolean;
  climateTargetCelsius: number;
}

export interface User {
  id: string;
  role: "customer" | "admin";
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  ownedVehicleIds: string[];
}

export interface ChargingSession {
  id: string;
  userId: string;
  vehicleId: string;
  stationId: string;
  energyKWh: number;
  cost: number;
  status: "completed" | "charging";
  startedAt: string;
  endedAt?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  currency: "$" | "₺";
  status: "processing" | "shipped" | "delivered" | "cancellation_requested" | "cancelled";
  createdAt: string;
}

export interface TestDrive {
  id: string;
  vehicleId: string;
  date: string;
  time: string;
  location: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "pending" | "confirmed" | "completed";
  userId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
