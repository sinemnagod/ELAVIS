import { readStorage, writeStorage, removeStorage, storageKeys } from "./storage";
import usersData from "@/data/users.json";
import ordersData from "@/data/orders.json";
import testDrivesData from "@/data/test-drives.json";
import sessionsData from "@/data/sessions.json";
import supportTicketsData from "@/data/support-tickets.json";
import { User, Order, TestDrive, ChargingSession, SupportTicket } from "@/types";

export interface Session {
  user: User;
  token: string;
}

// "Remember me" unchecked means the session should not survive closing the
// browser tab, so it's kept in sessionStorage instead of localStorage.
function readSessionStorage(): Session | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(storageKeys.session);
  if (!value) return null;
  try {
    return JSON.parse(value) as Session;
  } catch {
    return null;
  }
}

export function mockLogin(email: string, remember: boolean = true): Session | null {
  const users = readStorage<User[]>(storageKeys.users, usersData as User[]);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return null;
  }

  const session: Session = {
    user,
    token: `mock-jwt-token-for-${user.id}`
  };

  if (remember) {
    writeStorage(storageKeys.session, session);
    if (typeof window !== "undefined") window.sessionStorage.removeItem(storageKeys.session);
  } else {
    if (typeof window !== "undefined") window.sessionStorage.setItem(storageKeys.session, JSON.stringify(session));
    removeStorage(storageKeys.session);
  }

  return session;
}

export function getActiveSession(): Session | null {
  const session = readStorage<Session | null>(storageKeys.session, null) || readSessionStorage();
  if (session && session.user) {
    const users = readStorage<User[]>(storageKeys.users, usersData as User[]);
    const freshUser = users.find(u => u.id === session.user.id);
    if (freshUser) {
      return {
        ...session,
        user: freshUser
      };
    }
  }
  return session;
}

export function mockLogout() {
  removeStorage(storageKeys.session);
  if (typeof window !== "undefined") window.sessionStorage.removeItem(storageKeys.session);
}

// Writes `data` into `key` if what's currently stored is shorter than the
// seed set — i.e. on first load, or if storage was cleared. Once a user has
// generated more real records than the seed count, this stops touching it.
function seedIfShorter<T>(key: string, data: T[]) {
  const stored = readStorage<T[]>(key, []);
  if (stored.length < data.length) {
    writeStorage(key, data);
  }
}

export function seedLocalStorage() {
  // Seeds data if not already populated in localStorage
  if (typeof window !== "undefined") {
    seedIfShorter<User>(storageKeys.users, usersData as User[]);
    seedIfShorter<Order>(storageKeys.orders, ordersData as Order[]);
    seedIfShorter<TestDrive>(storageKeys.testDrives, testDrivesData as TestDrive[]);
    seedIfShorter<ChargingSession>(storageKeys.sessions, sessionsData as ChargingSession[]);
    seedIfShorter<SupportTicket>(storageKeys.supportTickets, supportTicketsData as SupportTicket[]);
  }
}
