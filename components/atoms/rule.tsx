import { cn } from "@/lib/utils";

type RuleProps = React.HTMLAttributes<HTMLHRElement>;

// Decorative divider — aria-hidden so screen readers don't announce it as
// content; visual rhythm only, not a semantic section boundary.
export function Rule({ className, ...props }: RuleProps): React.JSX.Element {
  return <hr aria-hidden="true" className={cn("border-t border-rule", className)} {...props} />;
}
