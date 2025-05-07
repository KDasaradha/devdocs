"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItemConfig } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronRight, Minus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface NavItemProps {
  item: NavItemConfig;
  depth?: number;
}

export function NavItem({ item, depth = 0 }: NavItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Normalize item.path to always start with a slash if it exists, and handle 'index' case
  const normalizedItemPath = item.path 
    ? (item.path === 'index' || item.path === '/' ? '/' : `/${item.path.replace(/^\//, '')}`) 
    : null;

  const isActive = normalizedItemPath ? pathname === normalizedItemPath : false;
  
  // Determine if any child is active to keep parent accordion open
  const isChildActive = item.children ? item.children.some(child => {
    const normalizedChildPath = child.path 
      ? (child.path === 'index' || child.path === '/' ? '/' : `/${child.path.replace(/^\//, '')}`)
      : null;
    return normalizedChildPath ? pathname === normalizedChildPath || pathname.startsWith(`${normalizedChildPath}/`) : false;
  }) : false;

  useEffect(() => {
    setIsOpen(isChildActive || isActive);
  }, [isChildActive, isActive, pathname]); // Added pathname to ensure re-evaluation on route change


  const itemIndentClass = `pl-${depth * 4}`;

  if (item.children && item.children.length > 0) {
    return (
      <Accordion type="single" collapsible className="w-full" value={isOpen ? item.title : "" } onValueChange={(value) => setIsOpen(value === item.title)}>
        <AccordionItem value={item.title} className="border-b-0">
          <AccordionTrigger 
            className={cn(
              "py-2 px-3 w-full text-left hover:bg-muted/50 rounded-md flex justify-between items-center",
              itemIndentClass,
              // An accordion trigger (parent) is active if itself is the target or one of its children is
              (isActive || isChildActive) && "font-semibold text-primary"
            )}
          >
            <span className="flex items-center">
              {item.title}
            </span>
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

  if (!normalizedItemPath) {
    return (
      <span className={cn("block py-2 px-3 text-muted-foreground", itemIndentClass)}>
        {item.title}
      </span>
    );
  }
  
  return (
    <Link
      href={normalizedItemPath}
      className={cn(
        "flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md transition-colors duration-150",
        itemIndentClass,
        isActive ? "font-semibold text-primary bg-muted/30" : "text-foreground/80 hover:text-foreground"
      )}
    >
      <Minus className={cn("h-3 w-3 shrink-0", depth === 0 && "hidden")} />
      {item.title}
    </Link>
  );
}

