import { readStorage, writeStorage, removeStorage, storageKeys } from "./storage";
import usersData from "@/data/users.json";
import { User } from "@/types";

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

export function seedLocalStorage() {
  // Seeds data if not already populated in localStorage
  if (typeof window !== "undefined") {
    const stored = readStorage<User[]>(storageKeys.users, []);
    if (stored.length < usersData.length) {
      writeStorage(storageKeys.users, usersData);
    }
  }
}
