"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import type { Role } from "@/types";

export function useAuth() {
  const { data: session, status, update } = useSession();

  const user = session?.user ?? null;
  const isLoading = status === "loading";
  const role = (user as Record<string, unknown> | null)?.role as
    | Role
    | undefined;

  const isAuthenticated = status === "authenticated";
  const isBuyer = role === "BUYER";
  const isFarmer = role === "FARMER";
  const isAdmin = role === "ADMIN";

  async function login(
    email: string,
    password: string,
    redirectTo?: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
      }

      await update();
      if (redirectTo) {
        window.location.href = redirectTo;
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง" };
    }
  }

  async function logout(): Promise<void> {
    await signOut({ redirect: true, callbackUrl: "/" });
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    isBuyer,
    isFarmer,
    isAdmin,
    login,
    logout,
  } as const;
}
