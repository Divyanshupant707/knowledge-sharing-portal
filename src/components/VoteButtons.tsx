import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  targetType: "question" | "answer";
  targetId: number;
  voteCount: number;
  userVote: number;
  onVote?: () => void;
  size?: "sm" | "md";
}

export default function VoteButtons({
  targetType,
  targetId,
  voteCount,
  userVote,
  onVote,
  size = "md",
}: VoteButtonsProps) {
  const utils = trpc.useUtils();

  const voteMutation =
    targetType === "question"
      ? trpc.question.vote.useMutation({
          onSuccess: () => {
            utils.question.byId.invalidate({ id: targetId });
            utils.question.bySlug.invalidate();
            onVote?.();
          },
        })
      : trpc.answer.vote.useMutation({
          onSuccess: () => {
            utils.answer.list.invalidate({ questionId: targetId });
            onVote?.();
          },
        });

  const iconSize = size === "sm" ? "w-5 h-5" : "w-6 h-6";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => voteMutation.mutate({
          ...(targetType === "question"
            ? { questionId: targetId, value: userVote === 1 ? 0 : 1 }
            : { answerId: targetId, value: userVote === 1 ? 0 : 1 }),
        } as never)}
        className={cn(
          "p-1 rounded transition-colors",
          userVote === 1
            ? "text-orange-500 bg-orange-50"
            : "text-slate-400 hover:text-orange-500 hover:bg-slate-50"
        )}
        title="Upvote"
      >
        <ArrowBigUp className={iconSize} />
      </button>

      <span
        className={cn(
          "font-bold tabular-nums",
          size === "sm" ? "text-sm" : "text-lg",
          voteCount > 0 ? "text-orange-600" : voteCount < 0 ? "text-blue-600" : "text-slate-600"
        )}
      >
        {voteCount}
      </span>

      <button
        onClick={() => voteMutation.mutate({
          ...(targetType === "question"
            ? { questionId: targetId, value: userVote === -1 ? 0 : -1 }
            : { answerId: targetId, value: userVote === -1 ? 0 : -1 }),
        } as never)}
        className={cn(
          "p-1 rounded transition-colors",
          userVote === -1
            ? "text-blue-500 bg-blue-50"
            : "text-slate-400 hover:text-blue-500 hover:bg-slate-50"
        )}
        title="Downvote"
      >
        <ArrowBigDown className={iconSize} />
      </button>
    </div>
  );
}
