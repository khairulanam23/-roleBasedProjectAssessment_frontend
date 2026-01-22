"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { User } from "@/types";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Client-only check for token
  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem("token");

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await api.get("/users/self");
      return res.data;
    },
    enabled: hasToken, // Only run if token exists (client-side)
    retry: false,
  });

  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await api.post("/auth/login", credentials);
      // Client-only write
      if (typeof window !== "undefined") {
        localStorage.setItem("token", res.data.token);
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Logged in successfully");
      router.push("/dashboard");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Login failed");
    },
  });

  const logout = () => {
    // Client-only remove
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    queryClient.clear();
    toast.info("Logged out");
    router.push("/login");
  };

  // Client-only redirect if no token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (
        !isLoading &&
        !token &&
        !["/login", "/register"].includes(window.location.pathname)
      ) {
        router.replace("/login");
      }
    }
  }, [isLoading, router]);

  return {
    user,
    isLoading,
    isAuthenticated: hasToken,
    login: login.mutate,
    loginLoading: login.isPending,
    logout,
    error,
  };
}
