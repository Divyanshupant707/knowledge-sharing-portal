import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import QuestionCard from "@/components/QuestionCard";
import MainLayout from "@/components/layout/MainLayout";
import { EmptyState } from "./Home";
import { Bookmark, ArrowLeft, Loader2 } from "lucide-react";

export default function Bookmarks() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const { data: bookmarks, isLoading } = trpc.bookmark.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Your Bookmarks
            </h1>
            <p className="text-sm text-slate-500">
              {bookmarks?.length || 0} saved questions
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : bookmarks?.length ? (
          <div className="space-y-4">
            {bookmarks.map((bm) =>
              bm.question ? (
                <QuestionCard key={bm.id} question={bm.question} />
              ) : null
            )}
          </div>
        ) : (
          <EmptyState
            icon={<Bookmark className="w-12 h-12" />}
            title="No bookmarks yet"
            description="Save questions you're interested in by clicking the bookmark button."
            action={
              <Button
                variant="outline"
                onClick={() => navigate("/questions")}
              >
                Browse Questions
              </Button>
            }
          />
        )}
      </div>
    </MainLayout>
  );
}
