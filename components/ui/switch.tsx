"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-300 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Unchecked state - elegant gray
        "data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700",
        // Checked state - vibrant gradient
        "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600",
        "dark:data-[state=checked]:from-blue-600 dark:data-[state=checked]:to-blue-700",
        // Hover states
        "hover:data-[state=unchecked]:bg-gray-300 dark:hover:data-[state=unchecked]:bg-gray-600",
        "hover:data-[state=checked]:from-blue-600 hover:data-[state=checked]:to-blue-700",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0",
          "transition-all duration-300 ease-in-out",
          // Transform and spacing
          "data-[state=unchecked]:translate-x-0",
          "data-[state=checked]:translate-x-5",
          // Subtle scale effect on toggle
          "data-[state=checked]:scale-105"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
