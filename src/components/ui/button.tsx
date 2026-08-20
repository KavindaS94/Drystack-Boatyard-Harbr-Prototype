import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        harbr:
          "bg-[hsl(252,75%,70%)] text-white shadow-xs hover:bg-[hsl(252,75%,60%)] focus-visible:ring-[hsl(252,75%,70%)]/20",
        harbrOutline:
          "border border-[hsl(252,75%,70%)] bg-background text-[hsl(252,75%,70%)] shadow-xs hover:bg-[hsl(252,75%,99%)] hover:text-[hsl(252,75%,60%)]",
        harbrSecondary: "bg-[hsl(252,75%,99%)] text-[hsl(252,75%,70%)] shadow-xs hover:bg-[hsl(252,75%,95%)]",
        success: "bg-[hsl(142,71%,45%)] text-white shadow-xs hover:bg-[hsl(142,71%,35%)]",
        warning: "bg-[hsl(36,100%,50%)] text-white shadow-xs hover:bg-[hsl(36,100%,40%)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  if (loading) {
    return (
      <button
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        disabled
        {...props}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {loadingText || children}
      </button>
    );
  }

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
