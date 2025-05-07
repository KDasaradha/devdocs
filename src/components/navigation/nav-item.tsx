"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItemConfig } from '@/types';
import { cn } from '@/lib/utils';
import { Minus, ChevronDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getNavLinkHref } from '@/lib/navigation'; 

interface NavItemProps {
  item: NavItemConfig;
  depth?: number;
}

const isPathOrDescendantActive = (basePath: string | null | undefined, currentPathname: string): boolean => {
  if (!basePath) return false;
  // Ensure paths end with a slash unless they are the root or contain anchors
  const normalizedBasePath = basePath === '/' ? '/' : (basePath.includes('#') ? basePath : `${basePath}/`);
  const normalizedCurrentPath = currentPathname === '/' ? '/' : `${currentPathname}/`;

  if (normalizedBasePath.includes('#')) {
      // For anchor links, check if the base path matches the current path
      return basePath === currentPathname;
  }
  
  // Check if the current path starts with the base path
  return normalizedCurrentPath.startsWith(normalizedBasePath);
};

export function NavItem({ item, depth = 0 }: NavItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const itemHref = item.path ? getNavLinkHref(item.path) : null;
  
  // An item is strictly active if its path matches the current pathname *exactly*.
  const isActive = itemHref ? pathname === itemHref : false; 

  // Check if this item or any of its children/descendants are active. Used for highlighting parent items.
  const isCurrentOrDescendantActive = itemHref ? isPathOrDescendantActive(itemHref, pathname) : false;

  // Check if any direct child route is currently active or is an ancestor of the active route. This is used to keep parent accordion items open.
  const isChildActive = item.children ? item.children.some(child => {
    const childHref = child.path ? getNavLinkHref(child.path) : null;
    return isPathOrDescendantActive(childHref, pathname);
  }) : false;


  // Effect to open the accordion item if it or one of its children is active.
  useEffect(() => {
      // Keep the accordion open if the current path is the item's path or a descendant
      // Or if any direct child is the current path or a descendant
      if (isCurrentOrDescendantActive || isChildActive) {
        setIsOpen(true);
      } else {
        // Optional: Collapse if neither the item nor its descendants are active.
        // Be careful with this if you want manual control over collapsing.
        // setIsOpen(false); 
      }
  }, [pathname, isCurrentOrDescendantActive, isChildActive]); 

  const itemIndentClass = `pl-${depth * 4}`;

  // Render item with children (Accordion)
  if (item.children && item.children.length > 0) {
    const triggerContent = (
      <>
        <span>{item.title}</span>
        <ChevronDown className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
        )} />
      </>
    );

    // Link component if path exists, otherwise span
    const TriggerWrapper = itemHref ? Link : 'span';
    const wrapperProps: any = itemHref ? { href: itemHref } : {};

    return (
      <Accordion 
        type="single" 
        collapsible 
        className="w-full" 
        value={isOpen ? item.title : ""} 
        onValueChange={(value) => setIsOpen(value === item.title)} // Allow manual toggle
      >
        <AccordionItem value={item.title} className="border-b-0"> 
          <AccordionTrigger 
            asChild // Pass props to the child (TriggerWrapper)
            className={cn(
              "py-2 px-3 w-full text-left hover:bg-muted/50 rounded-md flex items-center group text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", 
              itemIndentClass,
              (isCurrentOrDescendantActive || isChildActive) ? "text-primary" : "text-foreground/80 hover:text-foreground"
            )}
          >
            <TriggerWrapper {...wrapperProps} className="flex flex-1 items-center justify-between">
               {triggerContent}
            </TriggerWrapper>
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-0 pl-2"> 
            <ul className="space-y-1">
              {item.children.map((child, index) => (
                <li key={index}>
                  <NavItem item={child} depth={depth + 1} />
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  // Render leaf node (no children)
  
  // If it's a leaf node but has no path, render as plain text (unlikely based on config, but safe)
  if (!itemHref) { 
    return (
      <span className={cn(
        "flex items-center gap-2 py-2 px-3 text-muted-foreground text-sm", 
        itemIndentClass
      )}>
         {depth > 0 && <Minus className="h-3 w-3 shrink-0 text-muted-foreground/70" />}
        {item.title}
      </span>
    );
  }
  
  // Leaf node with a path, render as a link
  return (
    <Link
      href={itemHref}
      className={cn(
        "flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md transition-colors duration-150 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", 
        itemIndentClass,
        isActive ? "font-semibold text-primary bg-primary/10" : "text-foreground/80 hover:text-foreground"
      )}
    >
      {depth > 0 && <Minus className="h-3 w-3 shrink-0 text-muted-foreground/70" />}
      {item.title}
    </Link>
  );
}
