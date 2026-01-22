"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Project } from "@/types";
import { useState } from "react";

const projectFormSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
});

type ProjectForm = z.infer<typeof projectFormSchema>;

export default function ProjectManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: "", description: "" },
  });

  if (authLoading) return <Loader2 className="animate-spin" />;

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => api.get("/projects").then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProjectForm) => api.post("/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast("Project created");
      setOpen(false);
      form.reset();
    },
    onMutate: (data) => {
      // Optimistic update
      queryClient.setQueryData<Project[]>(["projects"], (old) => [
        ...old || [],
        { ...data, description: data.description || "", _id: 'temp', isDeleted: false, status: 'ACTIVE', createdBy: user!, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProjectForm & { id: string }) => api.patch(`/projects/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast("Project updated");
      setOpen(false);
      setEditing(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast("Project deleted");
    },
    onMutate: (id) => {
      // Optimistic update
      queryClient.setQueryData<Project[]>(["projects"], (old) => old?.filter(p => p._id !== id));
    },
  });

  const onSubmit = (data: ProjectForm) => {
    if (editing) {
      updateMutation.mutate({ ...data, id: editing._id });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (project: Project) => {
    form.setValue("name", project.name);
    form.setValue("description", project.description || "");
    setEditing(project);
    setOpen(true);
  };

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Project Management</h1>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Create Project</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{editing ? "Edit Project" : "Create Project"}</DialogTitle>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="description" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects?.map(p => (
            <TableRow key={p._id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.description}</TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell>{p.createdBy.name}</TableCell>
              <TableCell>
                {user?.role === 'ADMIN' && (
                  <>
                    <Button variant="ghost" onClick={() => openEdit(p)}>Edit</Button>
                    <Button variant="destructive" onClick={() => deleteMutation.mutate(p._id)}>Delete</Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}