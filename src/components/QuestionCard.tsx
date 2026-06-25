import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import TagBadge from "./TagBadge";
import { Eye, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: {
    id: number;
    title: string;
    content: string;
    slug: string;
    viewCount: number;
    voteCount: number;
    answerCount: number;
    isAcceptedAnswer: boolean;
    isClosed: boolean;
    createdAt: Date;
    author?: {
      id: number;
      name: string | null;
      avatar: string | null;
    } | null;
    category?: {
      name: string;
      slug: string;
    } | null;
    tags?: string[];
    questionTags?: { tag: { name: string } }[];
  };
  compact?: boolean;
}

export default function QuestionCard({ question, compact }: QuestionCardProps) {
  const displayTags =
    question.tags ||
    question.questionTags?.map((qt) => qt.tag.name) ||
    [];

  if (compact) {
    return (
      <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all">
        <div className="flex flex-col items-center gap-1 min-w-[60px]">
          <span className="text-lg font-bold text-slate-700">
            {question.voteCount}
          </span>
          <span className="text-xs text-slate-500">votes</span>
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/questions/${question.slug}`}
            className="text-blue-600 hover:text-blue-800 font-medium line-clamp-1"
          >
            {question.title}
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex flex-wrap gap-1">
              {displayTags.slice(0, 3).map((tag) => (
                <TagBadge key={tag} name={tag} />
              ))}
            </div>
            <span className="text-xs text-slate-400 ml-auto">
              {formatDate(question.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-4 p-5 bg-white rounded-xl border transition-all",
        "border-slate-200 hover:border-blue-300 hover:shadow-md"
      )}
    >
      {/* Vote/Stats Column */}
      <div className="flex flex-col items-center gap-2 min-w-[70px]">
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-slate-700">
            {question.voteCount}
          </span>
          <span className="text-xs text-slate-500">votes</span>
        </div>
        <div
          className={cn(
            "flex flex-col items-center px-2 py-1 rounded-lg",
            question.answerCount > 0
              ? question.isAcceptedAnswer
                ? "bg-green-50 border border-green-200"
                : "bg-blue-50 border border-blue-200"
              : ""
          )}
        >
          <span
            className={cn(
              "text-lg font-bold",
              question.isAcceptedAnswer
                ? "text-green-700"
                : question.answerCount > 0
                ? "text-blue-700"
                : "text-slate-700"
            )}
          >
            {question.answerCount}
          </span>
          <span className="text-xs text-slate-500">answers</span>
          {question.isAcceptedAnswer && (
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Eye className="w-3 h-3" />
          {question.viewCount}
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/questions/${question.slug}`}
          className="text-lg font-semibold text-slate-800 hover:text-blue-600 transition-colors line-clamp-2"
        >
          {question.title}
        </Link>

        <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
          {question.content.replace(/<[^>]*>/g, "").slice(0, 200)}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {displayTags.map((tag) => (
            <TagBadge key={tag} name={tag} />
          ))}
          {question.category && (
            <Badge variant="outline" className="text-xs bg-slate-50">
              {question.category.name}
            </Badge>
          )}
          {question.isClosed && (
            <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Closed
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={question.author?.avatar || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {question.author?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-slate-600">
              {question.author?.name || "Anonymous"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            {formatDate(question.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
