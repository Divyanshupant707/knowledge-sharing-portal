import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MainLayout from "@/components/layout/MainLayout";
import { MessageCircleQuestion, Send, X, Tag } from "lucide-react";
import { toast } from "sonner";

export default function AskQuestion() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const { data: categories } = trpc.category.list.useQuery();
  const utils = trpc.useUtils();

  const createQuestion = trpc.question.create.useMutation({
    onSuccess: (data) => {
      toast.success("Question posted successfully!");
      utils.question.list.invalidate();
      utils.dashboard.invalidate();
      navigate(`/questions/${data.slug}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) return;

    createQuestion.mutate({
      title: title.trim(),
      content: content.trim(),
      categoryId: parseInt(categoryId),
      tagNames: tags,
    });
  };

  if (!isAuthenticated) return null;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageCircleQuestion className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Ask a Question
            </h1>
            <p className="text-sm text-slate-500">
              Get help from the community. Be specific and detailed.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
              Title
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <p className="text-xs text-slate-500 mb-2">
              Be specific and imagine you&apos;re asking another person.
            </p>
            <Input
              id="title"
              placeholder="e.g., How to implement RBAC in Node.js?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              maxLength={300}
            />
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <Label className="text-sm font-semibold text-slate-700">
              Category
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <p className="text-xs text-slate-500 mb-2">
              Choose the most relevant category.
            </p>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <Label className="text-sm font-semibold text-slate-700">
              Tags
            </Label>
            <p className="text-xs text-slate-500 mb-2">
              Add up to 5 tags to help others find your question.
            </p>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="e.g., nodejs (press Enter to add)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <Tag className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <Label htmlFor="content" className="text-sm font-semibold text-slate-700">
              Details
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <p className="text-xs text-slate-500 mb-2">
              Explain your problem in detail. Include code, errors, and what
              you&apos;ve tried.
            </p>
            <Textarea
              id="content"
              placeholder="Describe your question in detail..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[250px] mt-1 font-mono text-sm"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={
                !title.trim() ||
                !content.trim() ||
                !categoryId ||
                createQuestion.isPending
              }
            >
              <Send className="w-4 h-4 mr-2" />
              {createQuestion.isPending ? "Posting..." : "Post Question"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/questions")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
