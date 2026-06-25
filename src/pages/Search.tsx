import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MainLayout from "@/components/layout/MainLayout";
import { EmptyState } from "./Home";
import { Search as SearchIcon, User, Tag, FolderOpen, FileText, Loader2 } from "lucide-react";

const FILTER_TYPES = [
  { value: "", label: "All", icon: <SearchIcon className="w-3.5 h-3.5" /> },
  { value: "question", label: "Questions", icon: <FileText className="w-3.5 h-3.5" /> },
  { value: "answer", label: "Answers", icon: <FileText className="w-3.5 h-3.5" /> },
  { value: "user", label: "Users", icon: <User className="w-3.5 h-3.5" /> },
  { value: "tag", label: "Tags", icon: <Tag className="w-3.5 h-3.5" /> },
  { value: "category", label: "Categories", icon: <FolderOpen className="w-3.5 h-3.5" /> },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const typeFilter = searchParams.get("type") || "";
  const [searchInput, setSearchInput] = useState(query);

  const { data: results, isLoading } = trpc.search.search.useQuery(
    {
      query,
      type: typeFilter as never || undefined,
      limit: 20,
    },
    { enabled: query.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim(), ...(typeFilter ? { type: typeFilter } : {}) });
    }
  };

  const handleTypeFilter = (type: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (type) {
      newParams.set("type", type);
    } else {
      newParams.delete("type");
    }
    setSearchParams(newParams);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Search</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search questions, answers, users, tags..."
              className="pl-11 pr-20 h-12 text-base"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600"
              size="sm"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTER_TYPES.map((f) => (
            <Button
              key={f.value}
              variant={typeFilter === f.value ? "default" : "outline"}
              size="sm"
              className={typeFilter === f.value ? "bg-blue-600" : "text-slate-600"}
              onClick={() => handleTypeFilter(f.value)}
            >
              {f.icon}
              <span className="ml-1">{f.label}</span>
            </Button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : query && results?.results.length ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-4">
              {results.total} results for &quot;{query}&quot;
            </p>
            {results.results.map((result, i) => (
              <SearchResultCard key={i} result={result} />
            ))}
          </div>
        ) : query ? (
          <EmptyState
            icon={<SearchIcon className="w-12 h-12" />}
            title="No results found"
            description={`We couldn't find anything matching "${query}". Try different keywords.`}
          />
        ) : (
          <div className="text-center py-16">
            <img
              src="/empty-search.jpg"
              alt="Search"
              className="w-48 h-48 mx-auto mb-6 opacity-70"
            />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Start searching
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Enter keywords to search across questions, answers, users, tags,
              and categories.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function SearchResultCard({ result }: { result: { id: number; type: string; title: string; content: string; tags?: string[]; author?: string; score: number } }) {
  const navigate = useNavigate();

  const getTypeColor = (type: string) => {
    switch (type) {
      case "question": return "bg-blue-50 text-blue-700 border-blue-200";
      case "answer": return "bg-green-50 text-green-700 border-green-200";
      case "user": return "bg-purple-50 text-purple-700 border-purple-200";
      case "tag": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const handleClick = () => {
    switch (result.type) {
      case "question":
        navigate(`/questions/${result.id}`);
        break;
      case "user":
        navigate(`/profile/${result.id}`);
        break;
      default:
        break;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <Badge variant="outline" className={`text-xs capitalize shrink-0 ${getTypeColor(result.type)}`}>
          {result.type}
        </Badge>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-800 line-clamp-1">{result.title}</h3>
          <p className="text-sm text-slate-500 line-clamp-2 mt-1">
            {result.content.slice(0, 200)}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            {result.author && <span>by {result.author}</span>}
            {result.tags && result.tags.length > 0 && (
              <div className="flex gap-1">
                {result.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-blue-500">#{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
