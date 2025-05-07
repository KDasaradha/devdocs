"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItemConfig } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronRight, Minus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getNavLinkHref } from '@/lib/navigation';

interface NavItemProps {
  item: NavItemConfig;
  depth?: number;
}

export function NavItem({ item, depth = 0 }: NavItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // item.path is now a slug (e.g., 'index', 'guides/getting-started')
  // Convert to href for comparison and linking
  const itemHref = item.path ? getNavLinkHref(item.path) : null;

  const isActive = itemHref ? pathname === itemHref : false;
  
  const isChildActive = item.children ? item.children.some(child => {
    const childHref = child.path ? getNavLinkHref(child.path) : null;
    return childHref ? pathname === childHref || pathname.startsWith(`${childHref}/`) : false;
  }) : false;

  useEffect(() => {
    // Automatically open if the item itself is active or a child is active
    if (isActive || isChildActive) {
      setIsOpen(true);
    }
    // Note: We might not want to auto-close if user manually opened it.
    // This useEffect primarily handles initial open state based on active route.
  }, [isActive, isChildActive, pathname]);


  const itemIndentClass = `pl-${depth * 4}`;

  if (item.children && item.children.length > 0) {
    return (
      <Accordion type="single" collapsible className="w-full" value={isOpen ? item.title : "" } onValueChange={(value) => setIsOpen(value === item.title)}>
        <AccordionItem value={item.title} className="border-b-0">
          <AccordionTrigger 
            className={cn(
              "py-2 px-3 w-full text-left hover:bg-muted/50 rounded-md flex justify-between items-center group", // Added group
              itemIndentClass,
              (isActive || isChildActive) && "font-semibold text-primary"
            )}
          >
            <span className="flex items-center">
              {item.title}
            </span>
            {/* Chevron managed by AccordionTrigger by default */}
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-0">
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

  if (!itemHref) { // If no path, render as text (e.g. section header without link)
    return (
      <span className={cn(
        "block py-2 px-3 text-muted-foreground font-medium",
        itemIndentClass,
        depth > 0 && "text-sm"
      )}>
        {item.title}
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