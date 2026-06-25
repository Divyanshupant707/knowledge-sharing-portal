import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QuestionCard from "@/components/QuestionCard";
import TagBadge from "@/components/TagBadge";
import MainLayout from "@/components/layout/MainLayout";
import {
  Search,
  MessageCircleQuestion,
  Users,
  Eye,
  TrendingUp,
  ArrowRight,
  Zap,
  Shield,
  Bookmark,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { data: dashboard } = trpc.dashboard.useQuery();
  const { data: categories } = trpc.category.list.useQuery();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/hero-bg.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Zap className="w-3 h-3 mr-1" />
              Powered by ElasticSearch
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Share Knowledge,
              <br />
              <span className="text-blue-300">Grow Together</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 leading-relaxed max-w-2xl">
              A multi-tiered Q&A platform built with Object-Oriented Design for
              modularity and scalability. Ask questions, share answers, and
              connect with experts.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button
                size="lg"
                className="bg-white text-blue-800 hover:bg-blue-50 font-semibold"
                onClick={() => navigate("/ask")}
              >
                <MessageCircleQuestion className="w-5 h-5 mr-2" />
                Ask a Question
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10"
                onClick={() => navigate("/questions")}
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Questions
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {dashboard && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16">
              <StatCard
                icon={<MessageCircleQuestion className="w-6 h-6" />}
                value={dashboard.stats.questions.toLocaleString()}
                label="Questions"
              />
              <StatCard
                icon={<Eye className="w-6 h-6" />}
                value={dashboard.stats.views.toLocaleString()}
                label="Total Views"
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                value={dashboard.stats.users.toLocaleString()}
                label="Members"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                value={dashboard.stats.answers.toLocaleString()}
                label="Answers"
              />
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Recent Questions */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Recent Questions
              </h2>
              <Button
                variant="ghost"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => navigate("/questions")}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-4">
              {dashboard?.recentQuestions?.length ? (
                dashboard.recentQuestions.map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))
              ) : (
                <EmptyState
                  icon={<MessageCircleQuestion className="w-12 h-12" />}
                  title="No questions yet"
                  description="Be the first to ask a question and start the conversation!"
                  action={
                    <Button onClick={() => navigate("/ask")}>
                      Ask a Question
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Categories */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-600" />
                Categories
              </h3>
              <div className="space-y-2">
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      navigate(`/questions?category=${cat.slug}`)
                    }
                    className="flex items-center justify-between w-full text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-md px-2 py-1.5 transition-colors"
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {cat.questionCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {dashboard?.popularTags?.map((tag) => (
                  <TagBadge key={tag.id} name={tag.name} />
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">
                Platform Features
              </h3>
              <div className="space-y-3">
                <FeatureItem
                  icon={<Zap className="w-4 h-4 text-amber-500" />}
                  title="ElasticSearch"
                  desc="High-speed resource discovery"
                />
                <FeatureItem
                  icon={<Shield className="w-4 h-4 text-green-500" />}
                  title="RBAC"
                  desc="Role-based access control"
                />
                <FeatureItem
                  icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
                  title="OOD Architecture"
                  desc="Modular & maintainable design"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <div className="text-blue-300 mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-blue-200">{label}</div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-slate-300 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-4">{description}</p>
      {action}
    </div>
  );
}
