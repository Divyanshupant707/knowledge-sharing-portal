import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionCard from "@/components/QuestionCard";
import MainLayout from "@/components/layout/MainLayout";
import {
  Trophy,
  MessageCircleQuestion,
  Clock,
  Award,
  Shield,
  Crown,
  Users,
} from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });

  const { data: myQuestions } = trpc.question.list.useQuery(
    { authorId: user?.id, limit: 50 },
    { enabled: !!user?.id }
  );

  if (!isAuthenticated || !user) return null;

  const getRoleBadge = (role: string) => {
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
            Member
          </Badge>
        );
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="w-24 h-24 ring-4 ring-blue-50">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-3xl">
                {user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-800">
                  {user.name || "Anonymous"}
                </h1>
                {getRoleBadge(user.role)}
              </div>
              <p className="text-slate-500">{user.email}</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">
                      {user.reputation || 0}
                    </p>
                    <p className="text-xs text-slate-500">Reputation</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <MessageCircleQuestion className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">
                      {myQuestions?.total || 0}
                    </p>
                    <p className="text-xs text-slate-500">Questions</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-500">Joined</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="questions" className="mt-8">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="questions">My Questions</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="mt-6">
            {myQuestions?.questions.length ? (
              <div className="space-y-4">
                {myQuestions.questions.map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <MessageCircleQuestion className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-600">
                  No questions yet
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Start asking questions to see them here.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-3">
                Bio
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {user.bio || "No bio added yet."}
              </p>

              <Separator className="my-6" />

              <h3 className="font-semibold text-slate-800 mb-3">
                Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  <Award className="w-3 h-3 mr-1 text-blue-600" />
                  Member
                </Badge>
                {user.reputation && user.reputation > 100 && (
                  <Badge variant="outline" className="bg-amber-50">
                    <Trophy className="w-3 h-3 mr-1 text-amber-600" />
                    Rising Star
                  </Badge>
                )}
                {user.reputation && user.reputation > 500 && (
                  <Badge variant="outline" className="bg-purple-50">
                    <Award className="w-3 h-3 mr-1 text-purple-600" />
                    Expert
                  </Badge>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
