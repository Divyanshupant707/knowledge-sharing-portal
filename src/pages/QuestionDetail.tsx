import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import VoteButtons from "@/components/VoteButtons";
import TagBadge from "@/components/TagBadge";
import MainLayout from "@/components/layout/MainLayout";
import {
  Clock,
  Eye,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Share2,
  ChevronLeft,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function QuestionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [answerContent, setAnswerContent] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [activeCommentTab, setActiveCommentTab] = useState<string | null>(null);

  const { data: question, isLoading } = trpc.question.bySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  const { data: answers } = trpc.answer.list.useQuery(
    { questionId: question?.id! },
    { enabled: !!question?.id }
  );

  const { data: questionComments } = trpc.comment.list.useQuery(
    { parentType: "question", parentId: question?.id! },
    { enabled: !!question?.id }
  );

  const utils = trpc.useUtils();

  const createAnswer = trpc.answer.create.useMutation({
    onSuccess: () => {
      setAnswerContent("");
      utils.answer.list.invalidate({ questionId: question?.id });
      utils.question.bySlug.invalidate({ slug: slug! });
      toast.success("Answer posted successfully!");
    },
    onError: (e) => toast.error(e.message),
  });

  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => {
      setCommentContent("");
      setActiveCommentTab(null);
      utils.comment.list.invalidate({ parentType: "question", parentId: question?.id });
      toast.success("Comment added!");
    },
  });

  const acceptAnswer = trpc.answer.accept.useMutation({
    onSuccess: () => {
      utils.answer.list.invalidate({ questionId: question?.id });
      utils.question.bySlug.invalidate({ slug: slug! });
      toast.success("Answer accepted!");
    },
  });

  const toggleBookmark = trpc.question.toggleBookmark.useMutation({
    onSuccess: () => {
      utils.question.bySlug.invalidate({ slug: slug! });
      toast.success("Bookmark updated!");
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </MainLayout>
    );
  }

  if (!question) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold text-slate-700">
            Question not found
          </h2>
          <Button
            variant="link"
            onClick={() => navigate("/questions")}
            className="mt-4"
          >
            Back to Questions
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isAuthor = user?.id === question.authorId;
  const hasBookmarks = question.bookmarks && question.bookmarks.length > 0;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Link */}
        <button
          onClick={() => navigate("/questions")}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Questions
        </button>

        {/* Question Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight">
            {question.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Asked {formatDate(question.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {question.viewCount} views
            </span>
            {question.isClosed && (
              <Badge
                variant="secondary"
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                Closed
              </Badge>
            )}
            {question.isAcceptedAnswer && (
              <Badge
                variant="secondary"
                className="bg-green-50 text-green-700 border-green-200"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Answered
              </Badge>
            )}
          </div>
        </div>

        {/* Question Body */}
        <div className="flex gap-5 mb-8">
          <VoteButtons
            targetType="question"
            targetId={question.id}
            voteCount={question.voteCount}
            userVote={0}
          />
          <div className="flex-1 min-w-0">
            <div
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: question.content
                  .replace(/\n/g, "<br/>")
                  .replace(/```([\s\S]*?)```/g, "<pre class='bg-slate-100 p-3 rounded-lg overflow-x-auto'><code>$1</code></pre>")
                  .replace(/`([^`]+)`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-sm'>$1</code>"),
              }}
            />

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {question.questionTags?.map((qt) => (
                <TagBadge key={qt.tag.id} name={qt.tag.name} />
              ))}
              {question.category && (
                <Badge variant="outline" className="bg-slate-50">
                  {question.category.name}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  className={hasBookmarks ? "text-blue-600" : ""}
                  onClick={() =>
                    toggleBookmark.mutate({ questionId: question.id })
                  }
                >
                  {hasBookmarks ? (
                    <BookmarkCheck className="w-4 h-4 mr-1" />
                  ) : (
                    <Bookmark className="w-4 h-4 mr-1" />
                  )}
                  {hasBookmarks ? "Bookmarked" : "Bookmark"}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
              }}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 mt-4 p-3 bg-slate-50 rounded-lg">
              <Avatar className="w-8 h-8">
                <AvatarImage src={question.author?.avatar || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {question.author?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {question.author?.name || "Anonymous"}
                </p>
                <p className="text-xs text-slate-500">Author</p>
              </div>
            </div>

            {/* Question Comments */}
            <div className="mt-6">
              <Separator className="mb-4" />
              <h3 className="text-sm font-semibold text-slate-600 mb-3">
                {questionComments?.length || 0} Comments
              </h3>
              <div className="space-y-3">
                {questionComments?.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <Avatar className="w-6 h-6 mt-0.5">
                      <AvatarImage
                        src={comment.author?.avatar || undefined}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {comment.author?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium text-slate-700">
                        {comment.author?.name || "Anonymous"}
                      </span>{" "}
                      <span className="text-slate-600">{comment.content}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {isAuthenticated && (
                <div className="mt-3">
                  <button
                    onClick={() =>
                      setActiveCommentTab(
                        activeCommentTab === "question" ? null : "question"
                      )
                    }
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Add a comment
                  </button>
                  {activeCommentTab === "question" && (
                    <div className="flex gap-2 mt-2">
                      <Textarea
                        placeholder="Write a comment..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <Button
                        size="sm"
                        className="self-end bg-blue-600"
                        onClick={() =>
                          createComment.mutate({
                            content: commentContent,
                            parentType: "question",
                            parentId: question.id,
                          })
                        }
                        disabled={!commentContent.trim()}
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Answers Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {answers?.length || 0} Answers
            </h2>
          </div>

          {answers?.map((answer) => (
            <AnswerItem
              key={answer.id}
              answer={answer}
              isQuestionAuthor={isAuthor}
              onAccept={() => acceptAnswer.mutate({ id: answer.id })}
            />
          ))}
        </div>

        {/* Post Answer */}
        {isAuthenticated && !question.isClosed && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Your Answer
            </h3>
            <Textarea
              placeholder="Write your answer here... Use markdown for formatting."
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              className="min-h-[150px]"
            />
            <div className="flex items-center gap-3 mt-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() =>
                  createAnswer.mutate({
                    content: answerContent,
                    questionId: question.id,
                  })
                }
                disabled={!answerContent.trim() || createAnswer.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {createAnswer.isPending ? "Posting..." : "Post Answer"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setAnswerContent("")}
              >
                Discard
              </Button>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
            <User className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">
              Sign in to post an answer or comment
            </p>
            <Button
              className="mt-3 bg-blue-600"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function AnswerItem({
  answer,
  isQuestionAuthor,
  onAccept,
}: {
  answer: {
    id: number;
    content: string;
    voteCount: number;
    isAccepted: boolean;
    createdAt: Date;
    author: {
      id: number;
      name: string | null;
      avatar: string | null;
    } | null;
  };
  isQuestionAuthor: boolean;
  onAccept: () => void;
}) {
  return (
    <div
      className={`flex gap-5 mb-6 p-5 rounded-xl border ${
        answer.isAccepted
          ? "border-green-300 bg-green-50/30"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col items-center gap-1 min-w-[60px]">
        <VoteButtons
          targetType="answer"
          targetId={answer.id}
          voteCount={answer.voteCount}
          userVote={0}
          size="sm"
        />
        {answer.isAccepted && (
          <div className="flex flex-col items-center text-green-600 mt-2">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-xs font-medium">Accepted</span>
          </div>
        )}
        {isQuestionAuthor && !answer.isAccepted && (
          <button
            onClick={onAccept}
            className="text-xs text-slate-400 hover:text-green-600 mt-2 transition-colors"
            title="Accept this answer"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm"
          dangerouslySetInnerHTML={{
            __html: answer.content
              .replace(/\n/g, "<br/>")
              .replace(/```([\s\S]*?)```/g, "<pre class='bg-slate-100 p-3 rounded-lg overflow-x-auto'><code>$1</code></pre>")
              .replace(/`([^`]+)`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-sm'>$1</code>"),
          }}
        />

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar className="w-7 h-7">
              <AvatarImage src={answer.author?.avatar || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {answer.author?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {answer.author?.name || "Anonymous"}
              </p>
              <p className="text-xs text-slate-400">
                {formatDate(answer.createdAt)}
              </p>
            </div>
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
