import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MessageCircleQuestion,
  Home,
  LogOut,
  User,
  Shield,
  Bookmark,
  Plus,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: suggestions } = trpc.search.suggestions.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageCircleQuestion className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800 hidden sm:block">
              KnowShare
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search questions, tags, users..."
                  className="pl-10 pr-4 h-9 bg-slate-100 border-slate-200 focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(e.target.value.length >= 2);
                  }}
                  onFocus={() =>
                    searchQuery.length >= 2 && setShowSuggestions(true)
                  }
                />
              </div>
            </form>

            {/* Search Suggestions */}
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(s)}`);
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                  >
                    <Search className="w-3 h-3 text-slate-400" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className={location.pathname === "/" ? "bg-slate-100" : ""}
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/questions")}
              className={
                location.pathname.startsWith("/questions")
                  ? "bg-slate-100"
                  : ""
              }
            >
              <MessageCircleQuestion className="w-4 h-4 mr-1" />
              Questions
            </Button>

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/ask")}
                className={
                  location.pathname === "/ask" ? "bg-slate-100" : ""
                }
              >
                <Plus className="w-4 h-4 mr-1" />
                Ask
              </Button>
            )}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2 rounded-md hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 hover:bg-slate-100 rounded-full px-2 py-1 transition-colors">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.avatar || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user?.email || ""}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            user?.role === "admin"
                              ? "bg-red-100 text-red-700"
                              : user?.role === "moderator"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user?.role}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/bookmarks")}
                      className="cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      Bookmarks
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={() => navigate("/admin")}
                        className="cursor-pointer"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1">
          <button
            onClick={() => {
              navigate("/");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
          >
            <Home className="w-4 h-4" /> Home
          </button>
          <button
            onClick={() => {
              navigate("/questions");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
          >
            <MessageCircleQuestion className="w-4 h-4" /> Questions
          </button>
          <button
            onClick={() => {
              navigate("/ask");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
          >
            <Plus className="w-4 h-4" /> Ask Question
          </button>
          <button
            onClick={() => {
              navigate("/bookmarks");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
          >
            <Bookmark className="w-4 h-4" /> Bookmarks
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                navigate("/admin");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-slate-100 text-sm"
            >
              <Shield className="w-4 h-4" /> Admin Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
}
