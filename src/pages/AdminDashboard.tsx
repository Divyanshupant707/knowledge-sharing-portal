import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/components/layout/MainLayout";
import {
  Shield,
  Users,
  MessageCircleQuestion,
  MessageSquare,
  Eye,
  Crown,
  UserCheck,
  AlertTriangle,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });

  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  const { data: stats } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: usersList } = trpc.admin.users.useQuery(undefined, {
    enabled: isAdmin,
  });

  const utils = trpc.useUtils();

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      utils.admin.users.invalidate();
      toast.success("User role updated!");
    },
  });

  if (!isAuthenticated) return null;

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800">
            Access Denied
          </h1>
          <p className="text-slate-500 mt-2">
            You need admin or moderator privileges to access this page.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate("/")}
          >
            Go Home
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Platform overview and management
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            label="Total Users"
            value={stats?.users.total ?? 0}
            sub={`${stats?.users.admins || 0} admins`}
          />
          <StatCard
            icon={<MessageCircleQuestion className="w-5 h-5 text-green-600" />}
            label="Questions"
            value={stats?.questions.active ?? 0}
            sub={`${stats?.questions.closed || 0} closed`}
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5 text-purple-600" />}
            label="Answers"
            value={stats?.answers.active ?? 0}
            sub={`${stats?.answers.accepted || 0} accepted`}
          />
          <StatCard
            icon={<Eye className="w-5 h-5 text-amber-600" />}
            label="Total Views"
            value={stats?.questions.totalViews ?? 0}
            sub="across all questions"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 pt-6">
            <TabsList>
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-1" />
                Users
              </TabsTrigger>
              <TabsTrigger value="overview">
                <Shield className="w-4 h-4 mr-1" />
                Overview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users" className="p-6 pt-2">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              User Management ({usersList?.total || 0})
            </h3>

            {usersList ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Reputation</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                            {u.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {u.name || "Anonymous"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{u.reputation || 0}</span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {u.role !== "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() =>
                                updateRole.mutate({
                                  userId: u.id,
                                  role: "admin",
                                })
                              }
                            >
                              <Crown className="w-3.5 h-3.5 mr-1" />
                              Make Admin
                            </Button>
                          )}
                          {u.role !== "user" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() =>
                                updateRole.mutate({
                                  userId: u.id,
                                  role: "user",
                                })
                              }
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              Set User
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="overview" className="p-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-700 mb-3">
                  User Distribution
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Regular Users</span>
                    <span className="font-medium">{stats?.users.active || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Moderators</span>
                    <span className="font-medium">{stats?.users.moderators || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Admins</span>
                    <span className="font-medium">{stats?.users.admins || 0}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-700 mb-3">
                  Content Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Active Questions</span>
                    <span className="font-medium">{stats?.questions.active || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Closed Questions</span>
                    <span className="font-medium">{stats?.questions.closed || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Active Comments</span>
                    <span className="font-medium">{stats?.comments.total || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "admin":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
          <Crown className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    case "moderator":
      return (
        <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
          <Shield className="w-3 h-3 mr-1" />
          Moderator
        </Badge>
      );
    default:
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
          <Users className="w-3 h-3 mr-1" />
          User
        </Badge>
      );
  }
}
