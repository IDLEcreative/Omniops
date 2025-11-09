"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border-2 cursor-pointer",
      "transition-all duration-200 ease-in-out",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Unchecked state
      "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
      "hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm",
      // Checked state - vibrant gradient
      "data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600",
      "data-[state=checked]:border-blue-500 data-[state=checked]:shadow-md",
      "dark:data-[state=checked]:from-blue-600 dark:data-[state=checked]:to-blue-700",
      "data-[state=checked]:scale-105",
      // Indeterminate state
      "data-[state=indeterminate]:bg-gradient-to-br data-[state=indeterminate]:from-blue-500 data-[state=indeterminate]:to-blue-600",
      "data-[state=indeterminate]:border-blue-500 data-[state=indeterminate]:shadow-md",
      "dark:data-[state=indeterminate]:from-blue-600 dark:data-[state=indeterminate]:to-blue-700",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-white",
        "animate-in zoom-in-50 duration-200"
      )}
    >
      {props.checked === "indeterminate" ? (
        <Minus className="h-3.5 w-3.5 stroke-[3]" />
      ) : (
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
