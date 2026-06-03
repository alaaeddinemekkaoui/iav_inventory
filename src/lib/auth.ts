import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readStore, writeStore } from "@/lib/db";

export const roles = ["USER", "ADMIN", "SUPER_ADMIN"] as const;
export type UserRole = (typeof roles)[number];

export type AppUser = {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
};

type AuthSession = {
  token: string;
  userId: string;
  createdAt: string;
};

type AuthData = {
  users: AppUser[];
  sessions: AuthSession[];
};

export type CurrentUser = Omit<AppUser, "passwordHash">;

const sessionCookie = "iav_session";
const roleRank: Record<UserRole, number> = {
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

const defaultSuperAdmin = {
  fullName: "Super Admin IT",
  username: "superadmin",
  password: "superadmin123",
};

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function publicUser(user: AppUser): CurrentUser {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(storedHash, "hex"));
}

async function readAuth(): Promise<AuthData> {
  const data = await readStore<Partial<AuthData>>("auth", { users: [], sessions: [] });
  return {
    users: data.users ?? [],
    sessions: data.sessions ?? [],
  };
}

async function writeAuth(data: AuthData) {
  await writeStore("auth", data);
}

export async function ensureDefaultSuperAdmin() {
  const data = await readAuth();
  if (data.users.some((user) => user.role === "SUPER_ADMIN")) return data;

  const now = new Date().toISOString();
  data.users.push({
    id: newId("usr"),
    fullName: defaultSuperAdmin.fullName,
    username: defaultSuperAdmin.username,
    role: "SUPER_ADMIN",
    passwordHash: hashPassword(defaultSuperAdmin.password),
    createdAt: now,
  });
  await writeAuth(data);
  return data;
}

export async function listUsers() {
  const data = await ensureDefaultSuperAdmin();
  return data.users.map(publicUser).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function login(username: string, password: string) {
  const data = await ensureDefaultSuperAdmin();
  const user = data.users.find((item) => item.username.toLowerCase() === username.toLowerCase());

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return false;
  }

  const token = randomBytes(32).toString("hex");
  data.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  await writeAuth(data);

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return true;
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  const data = await readAuth();
  const nextData = {
    ...data,
    sessions: data.sessions.filter((session) => session.token !== token),
  };
  await writeAuth(nextData);
  cookieStore.delete(sessionCookie);
}

export async function getCurrentUser(): Promise<CurrentUser | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) return undefined;

  const data = await ensureDefaultSuperAdmin();
  const session = data.sessions.find((item) => item.token === token);
  const user = session ? data.users.find((item) => item.id === session.userId) : undefined;

  return user ? publicUser(user) : undefined;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (roleRank[user.role] < roleRank[role]) redirect("/");
  return user;
}

export async function createUserAccount(input: {
  fullName: string;
  username: string;
  password: string;
  role: UserRole;
}) {
  await requireRole("SUPER_ADMIN");
  const data = await ensureDefaultSuperAdmin();
  const username = input.username.trim();

  if (data.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Ce username existe deja.");
  }

  data.users.push({
    id: newId("usr"),
    fullName: input.fullName.trim(),
    username,
    role: input.role,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  });
  await writeAuth(data);
}

export { defaultSuperAdmin };
