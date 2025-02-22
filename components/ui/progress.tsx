// components/ui/progress.tsx
import * as React from "react";
import { cn } from "@/lib/utils"; // Asegúrate de tener esta utilidad

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-gray-200",
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 transition-all duration-300 ease-out"
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        >
          <div
            className="h-full w-full rounded-full bg-green-500"
            style={{
              transform: `translateX(${100 - (value || 0)}%)`,
              transition: "transform 300ms ease-out",
            }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };