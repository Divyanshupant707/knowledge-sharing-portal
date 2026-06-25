import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QuestionCard from "@/components/QuestionCard";
import MainLayout from "@/components/layout/MainLayout";
import { EmptyState } from "./Home";
import {
  Search,
  MessageCircleQuestion,
  Plus,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Viewed" },
  { value: "votes", label: "Most Voted" },
  { value: "unanswered", label: "Unanswered" },
] as const;

export default function Questions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]["value"]>(
    (searchParams.get("sort") as never) || "newest"
  );
  const categorySlug = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  const { data: categoryData } = trpc.category.bySlug.useQuery(
    { slug: categorySlug! },
    { enabled: !!categorySlug }
  );

  const { data, isLoading } = trpc.question.list.useQuery({
    categoryId: categoryData?.id,
    search: searchParams.get("search") || undefined,
    sortBy,
    limit,
    offset,
  });

  const handleSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set("search", searchInput.trim());
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleSort = (sort: string) => {
    setSortBy(sort as never);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sort", sort);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {categoryData?.name || "All Questions"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {data?.total || 0} questions
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/ask")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ask Question
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-1">
            <Input
              placeholder="Search questions..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-1">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 mr-1 self-center" />
            {SORT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={sortBy === opt.value ? "default" : "ghost"}
                size="sm"
                className={
                  sortBy === opt.value ? "bg-blue-600" : "text-slate-600"
                }
                onClick={() => handleSort(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-slate-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : data?.questions.length ? (
          <div className="space-y-4">
            {data.questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MessageCircleQuestion className="w-12 h-12" />}
            title="No questions found"
            description="Try adjusting your search or filters, or be the first to ask a question!"
            action={
              <Button onClick={() => navigate("/ask")}>
                <Plus className="w-4 h-4 mr-2" />
                Ask a Question
              </Button>
            }
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  className={page === pageNum ? "bg-blue-600" : ""}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
