"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItemConfig } from '@/types';
import { cn } from '@/lib/utils';
import { Minus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getNavLinkHref } from '@/lib/navigation'; // Ensure this helper is used

interface NavItemProps {
  item: NavItemConfig;
  depth?: number;
}

// Helper to check if a given path is a descendant of another path
// Needed because `pathname.startsWith(itemHref)` isn't sufficient if itemHref is '/'
const isPathDescendant = (parentHref: string, currentPathname: string): boolean => {
  if (parentHref === '/') {
    // The root path '/' is considered an ancestor of all paths except itself when checking descendants
    return currentPathname !== '/';
  }
  // Ensure trailing slash consistency for comparison
  const parentWithSlash = parentHref.endsWith('/') ? parentHref : `${parentHref}/`;
  const currentWithSlash = currentPathname.endsWith('/') ? currentPathname : `${currentPathname}/`;
  // Check if current path starts with the parent path AND is longer (meaning it's a descendant)
  return currentWithSlash.startsWith(parentWithSlash) && currentWithSlash.length > parentWithSlash.length;
};


export function NavItem({ item, depth = 0 }: NavItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const itemHref = item.path ? getNavLinkHref(item.path) : null;
  // isActive: exact match or if itemHref is '/' and pathname is '/'
  const isActive = itemHref ? pathname === itemHref : false; 

  // Check if any child item's href is an exact match or an ancestor of the current pathname
  const isChildActive = item.children ? item.children.some(child => {
    const childHref = child.path ? getNavLinkHref(child.path) : null;
    if (!childHref) return false;
    // Exact match or if the current pathname starts with the child's path (and isn't the same path)
    return pathname === childHref || pathname.startsWith(`${childHref}/`);
  }) : false;

  useEffect(() => {
    // Automatically open if a child is active or if the item itself is active (for non-index paths)
    if (isChildActive || (isActive && itemHref !== '/')) {
      setIsOpen(true);
    }
    // Optional: Close if neither this nor children are active anymore?
    // else if (!isActive && !isChildActive) {
    //    setIsOpen(false);
    // }
  }, [isActive, isChildActive, itemHref, pathname]);


  const itemIndentClass = `pl-${depth * 4}`; // e.g., pl-0, pl-4, pl-8

  if (item.children && item.children.length > 0) {
    // This item is a folder/group
    return (
      <Accordion 
        type="single" 
        collapsible 
        className="w-full" 
        value={isOpen ? item.title : ""} 
        onValueChange={(value) => setIsOpen(value === item.title)}
      >
        <AccordionItem value={item.title} className="border-b-0">
          {/* Render as link if it has a path, otherwise just the trigger text */}
          <AccordionTrigger 
            className={cn(
              "py-2 px-3 w-full text-left hover:bg-muted/50 rounded-md flex justify-between items-center group text-sm", // Ensure consistent text size
              itemIndentClass,
              // Apply active styling if the trigger itself matches or if a child is active
              (isActive || isChildActive) && "font-semibold text-primary" 
            )}
            asChild={!!itemHref} // Render trigger as child of Link if itemHref exists
          >
            {itemHref ? (
              <Link href={itemHref} className="flex items-center grow mr-1" onClick={(e) => e.stopPropagation()}> {/* Prevent accordion toggle on link click */}
                {item.title}
              </Link>
            ) : (
              <span className="flex items-center grow mr-1">{item.title}</span>
            )}
            {/* Chevron is automatically added by AccordionTrigger */}
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-0 pl-2"> {/* Add slight indent for children */}
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

  // This item is a leaf node (a page link)
  if (!itemHref) { // Should not happen for leaf nodes based on config, but handle defensively
    return (
      <span className={cn("block py-2 px-3 text-muted-foreground", itemIndentClass, "text-sm")}>
        {item.title} (No path)
      </span>
    );
  }
  
  return (
    <Link
      href={itemHref}
      className={cn(
        "flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md transition-colors duration-150 text-sm",
        itemIndentClass,
        isActive ? "font-semibold text-primary bg-primary/10" : "text-foreground/80 hover:text-foreground"
      )}
      onClick={() => {
        // Potentially close other accordions or handle mobile nav close if needed
      }}
    >
      {depth > 0 && <Minus className="h-3 w-3 shrink-0 text-muted-foreground/70" />}
      {item.title}
    </Link>
  );
}