export const storageKeys = {
  session: "evalis.session",
  cart: "evalis.cart",
  orders: "evalis.orders",
  testDrives: "evalis.testDrives",
  users: "evalis.users",
  stations: "evalis.stations",
  sessions: "evalis.sessions",
  schedules: "evalis.schedules",
  notifications: "evalis.notifications",
  language: "evalis.language",
  dashboardTheme: "evalis.dashboardTheme",
  dashboardSidebarCollapsed: "evalis.dashboard.sidebarCollapsed",
  products: "evalis.products",
  productCategories: "evalis.productCategories",
  vehicles: "evalis.vehicles",
  adminSettings: "evalis.adminSettings",
  adminTheme: "evalis.admin.theme",
  adminSidebarCollapsed: "evalis.admin.sidebarCollapsed",
  vehicleRequests: "evalis.vehicleRequests",
  allReservations: "evalis.allReservations"
} as const;

export const userStorageKeys = {
  favoriteStations: (userId: string) => `evalis.favoriteStations.${userId}`,
  ownedVehicles: (userId: string) => `evalis.owned.${userId}`,
  schedules: (userId: string) => `evalis.schedules.${userId}`,
  vehicleSettings: (userId: string, vehicleId: string) =>
    `evalis.vehicleSettings.${userId}.${vehicleId}`,
  activeVehicleId: (userId: string) => `evalis.activeVehicleId.${userId}`,
  reservations: (userId: string) => `evalis.reservations.${userId}`,
  precondition: (userId: string) => `evalis.precondition.${userId}`,
  phone: (userId: string) => `evalis.phone.${userId}`,
  chargeLimit: (userId: string) => `evalis.chargelimit.${userId}`,
  telemetry: (userId: string, vehicleId: string) => `evalis.telemetry.${userId}.${vehicleId}`,
  rewardsPoints: (userId: string) => `evalis.rewardsPoints.${userId}`,
  reservationExpiry: (userId: string) => `evalis.reservationExpiry.${userId}`,
  liveCharging: (userId: string) => `evalis.liveCharging.${userId}`
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.localStorage.getItem(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}
