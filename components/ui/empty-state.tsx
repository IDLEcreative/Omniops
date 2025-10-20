import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  variant?: "default" | "compact" | "card";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  variant = "default",
}: EmptyStateProps) {
  const isCompact = variant === "compact";
  const isCard = variant === "card";

  const containerClasses = cn(
    "flex flex-col items-center justify-center text-center",
    {
      "py-12 px-6": variant === "default",
      "py-6 px-4": isCompact,
      "py-8 px-6 bg-muted/20 rounded-lg border border-muted": isCard,
    },
    className
  );

  const iconClasses = cn("text-muted-foreground", {
    "h-12 w-12 mb-4": variant === "default",
    "h-8 w-8 mb-2": isCompact,
    "h-10 w-10 mb-3": isCard,
  });

  const titleClasses = cn("font-semibold", {
    "text-lg": variant === "default",
    "text-sm": isCompact,
    "text-base": isCard,
  });

  const descriptionClasses = cn("text-muted-foreground", {
    "text-sm mt-2 max-w-md": variant === "default",
    "text-xs mt-1 max-w-sm": isCompact,
    "text-sm mt-1.5 max-w-sm": isCard,
  });

  const buttonClasses = cn({
    "mt-6": variant === "default",
    "mt-3": isCompact,
    "mt-4": isCard,
  });

  const showAction = actionLabel && (actionHref || onAction);

  return (
    <div className={containerClasses}>
      {Icon && <Icon className={iconClasses} />}
      <h3 className={titleClasses}>{title}</h3>
      {description && <p className={descriptionClasses}>{description}</p>}
      {showAction && (
        <div className={buttonClasses}>
          {actionHref ? (
            <Button asChild variant={isCompact ? "outline" : "default"} size={isCompact ? "sm" : "default"}>
              <a href={actionHref}>{actionLabel}</a>
            </Button>
          ) : (
            <Button onClick={onAction} variant={isCompact ? "outline" : "default"} size={isCompact ? "sm" : "default"}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}