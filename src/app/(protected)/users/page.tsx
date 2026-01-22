"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Clock, CheckCircle2, XCircle } from "lucide-react";
import { User } from "@/types";
import { useState } from "react";

const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface Invite {
  _id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pageUsers, setPageUsers] = useState(1);
  const [pageInvites, setPageInvites] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["users", pageUsers],
    queryFn: async () => {
      const res = await api.get(`/users?page=${pageUsers}&limit=10`);
      return res.data as { users: User[]; total: number };
    },
    enabled: !!user && user.role === "ADMIN",
  });

  // Invites query
  const {
    data: invitesData,
    isLoading: invitesLoading,
    error: invitesError,
  } = useQuery({
    queryKey: ["invites", pageInvites],
    queryFn: async () => {
      const res = await api.get(`/auth/invites?page=${pageInvites}&limit=10`);
      return res.data as { invites: Invite[]; total: number };
    },
    enabled: !!user && user.role === "ADMIN",
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) =>
      api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role updated");
    },
    onError: () => toast.error("Failed to update role"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteForm) => api.post("/auth/invite", data),
    onSuccess: (res) => {
      const token = res.data.token || "unknown";
      const inviteLink = `${window.location.origin}/register?token=${token}`;

      navigator.clipboard
        .writeText(inviteLink)
        .then(() => {
          toast.success("Invite sent! Link copied to clipboard.", {
            description: inviteLink,
            action: {
              label: "Copy again",
              onClick: () => navigator.clipboard.writeText(inviteLink),
            },
          });
        })
        .catch(() => {
          toast.warning("Invite sent! Failed to copy link.", {
            description: `Copy manually: ${inviteLink}`,
          });
        });

      setInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to send invite"),
  });

  const inviteForm = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "STAFF" },
  });

  if (!user || user.role !== "ADMIN")
    return <div className="p-8 text-red-500 text-center">Access denied</div>;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Invite New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send New Invite</DialogTitle>
            </DialogHeader>
            <Form {...inviteForm}>
              <form
                onSubmit={inviteForm.handleSubmit((data) =>
                  inviteMutation.mutate(data),
                )}
                className="space-y-4"
              >
                <FormField
                  control={inviteForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="MANAGER">MANAGER</SelectItem>
                          <SelectItem value="STAFF">STAFF</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="w-full"
                >
                  {inviteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Sending...
                    </>
                  ) : (
                    "Send & Copy Link"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Current Users</TabsTrigger>
          <TabsTrigger value="invites">Invite History</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {usersLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : usersError ? (
            <div className="text-red-500 text-center py-10">
              Error loading users
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(v) =>
                            updateRole.mutate({ id: u._id, role: v })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                            <SelectItem value="MANAGER">MANAGER</SelectItem>
                            <SelectItem value="STAFF">STAFF</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.status}
                          onValueChange={(v) =>
                            updateStatus.mutate({ id: u._id, status: v })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser.mutate(u._id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPageUsers((p) => Math.max(1, p - 1))}
                  disabled={pageUsers === 1}
                >
                  Previous
                </Button>
                <span>Page {pageUsers}</span>
                <Button
                  variant="outline"
                  onClick={() => setPageUsers((p) => p + 1)}
                  disabled={(usersData?.users.length || 0) < 10}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="invites">
          {invitesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : invitesError ? (
            <div className="text-red-500 text-center py-10">
              Error loading invite history
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Accepted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitesData?.invites.map((i) => {
                    const isExpired =
                      new Date(i.expiresAt) < new Date() && !i.acceptedAt;
                    return (
                      <TableRow key={i._id}>
                        <TableCell>{i.email}</TableCell>
                        <TableCell>{i.role}</TableCell>
                        <TableCell>
                          {i.acceptedAt ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Accepted
                            </span>
                          ) : isExpired ? (
                            <span className="text-red-600 flex items-center gap-1">
                              <XCircle className="h-4 w-4 mr-1" /> Expired
                            </span>
                          ) : (
                            <span className="text-blue-600 flex items-center gap-1">
                              <Clock className="h-4 w-4 mr-1" /> Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(i.expiresAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {i.acceptedAt
                            ? new Date(i.acceptedAt).toLocaleString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPageInvites((p) => Math.max(1, p - 1))}
                  disabled={pageInvites === 1}
                >
                  Previous
                </Button>
                <span>Page {pageInvites}</span>
                <Button
                  variant="outline"
                  onClick={() => setPageInvites((p) => p + 1)}
                  disabled={(invitesData?.invites.length || 0) < 10}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}