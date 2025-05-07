"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex"> 
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        // Base styles for the trigger
        "flex flex-1 items-center justify-between py-2 font-medium transition-all",
        // Hover and focus styles
        "hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
        // Data state for open/closed styling (e.g., rotating the icon)
        // Removed the explicit icon rotation here; let the parent component handle icon state if needed
        // "[&[data-state=open]>svg]:rotate-180", 
        className // Allow external classes to override/extend
      )}
      {...props} // Spread remaining props, including potential 'asChild'
    >
      {/* Render children passed to AccordionTrigger */}
      {/* When asChild is true, this expects a SINGLE React Element child */}
      {children} 
      
      {/* REMOVED the default ChevronDown icon rendering. */}
      {/* The component using AccordionTrigger with `asChild` (like NavItem) is now responsible for rendering its own indicator icon (e.g., ChevronDown) inside the child element it passes. */}
      {/* {!props.asChild && (
           <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      )} */}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName


const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn( // Combined classes for clarity
      "overflow-hidden text-sm transition-all",
      "data-[state=closed]:animate-accordion-up",
      "data-[state=open]:animate-accordion-down",
      className // Allow external classes
    )}
    {...props}
  >
    {/* Add padding within the content area */}
    {/* Changed pb-4 pt-0 to just apply className if needed, padding handled by consumer */}
    <div className={cn("pt-0 pb-4", className)}>{children}</div> 
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
