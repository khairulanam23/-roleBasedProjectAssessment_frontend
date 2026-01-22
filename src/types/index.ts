export interface User {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  status: "ACTIVE" | "INACTIVE";
  invitedAt?: string;
  createdAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "ARCHIVED" | "DELETED";
  isDeleted: boolean;
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}
