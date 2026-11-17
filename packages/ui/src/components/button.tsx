import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@jstack/ui/lib/utils";

const buttonVariants = cva(
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Borderless variants get a solid focus ring (offset on filled ones):
        // the soft 25% ring is only for controls whose border also changes.
        default:
          "shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:border disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none",
        destructive:
          "shadow-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "shadow-xs border bg-transparent hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        // Like `outline` but with a solid `bg-background` fill, so it reads as a
        // white surface on both tinted panels and plain white backgrounds.
        surface:
          "shadow-xs border bg-background hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        "outline-primary":
          "shadow-xs border-2 border-primary bg-background hover:bg-background/90 focus-visible:ring-ring/25",
        secondary:
          "shadow-xs bg-secondary text-secondary-foreground hover:bg-secondary/80",
        alt: "shadow-xs bg-background hover:bg-background/90",
        ghost:
          "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-ring",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3 sm:h-9",
        // 40px on phones (tap target), compact from sm up.
        sm: "h-10 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5 sm:h-8",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10 sm:size-9",
        landing: "rounded-full px-6 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
