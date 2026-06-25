import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  className?: string;
  onClick?: () => void;
}

export default function TagBadge({ name, className, onClick }: TagBadgeProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={onClick || (() => navigate(`/questions?tag=${encodeURIComponent(name)}`))}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium",
        "bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors",
        "border border-blue-200",
        className
      )}
    >
      {name}
    </button>
  );
}
