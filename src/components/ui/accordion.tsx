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
  // The Header provides the flex context if needed, especially if you have more elements
  // alongside the Trigger, though often the Trigger itself is the main flex item.
  <AccordionPrimitive.Header className="flex"> 
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        // Base styles for the trigger
        "flex flex-1 items-center justify-between py-2 font-medium transition-all",
        // Hover and focus styles
        "hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
        // Data state for open/closed styling (e.g., rotating the icon)
        "[&[data-state=open]>svg]:rotate-180",
        className // Allow external classes to override/extend
      )}
      {...props} // Spread remaining props, including potential 'asChild'
    >
      {/* Render children passed to AccordionTrigger */}
      {children} 
      
      {/* Conditionally render the ChevronDown icon */}
      {/* Render ONLY if 'asChild' is NOT used, OR if 'asChild' IS used but the single child element 
          passed to it does NOT inherently contain its own icon/chevron indicator. */}
      {/* Since we often pass complex children like divs or links when using asChild,
          we generally rely on the CHILD element to include the chevron if needed.
          So, the simple check here is: if NOT using asChild, render the default chevron. */}
      {!props.asChild && (
           <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      )}
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
    <div className={cn("pb-4 pt-0", className)}>{children}</div> 
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
