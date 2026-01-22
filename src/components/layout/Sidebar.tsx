"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard, Users, FolderKanban, LogOut } from "lucide-react";

export function Sidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <aside className="w-64 border-r bg-card p-6 flex flex-col">
      <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
      <nav className="flex-1 space-y-2">
        <Link href="/dashboard">
          <Button variant="ghost" className="w-full justify-start">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>
        </Link>
        <Link href="/projects">
          <Button variant="ghost" className="w-full justify-start">
            <FolderKanban className="mr-2 h-4 w-4" /> Projects
          </Button>
        </Link>
        {user.role === "ADMIN" && (
          <Link href="/users">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" /> Users
            </Button>
          </Link>
        )}
      </nav>
      <Button variant="outline" className="mt-auto" onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </Button>
    </aside>
  );
}