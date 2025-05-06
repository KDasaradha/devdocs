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

  const isActive = item.path ? pathname === item.path || (item.path === '/' && pathname.startsWith('/index')) || pathname === item.path + '/index' : false;
  
  // Determine if any child is active to keep parent accordion open
  const isChildActive = item.children ? item.children.some(child => {
    const childPath = child.path || '';
    return pathname === childPath || (childPath === '/' && pathname.startsWith('/index')) || pathname === childPath + '/index' || pathname.startsWith(childPath + '/');
  }) : false;

  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive, pathname]);


  const itemIndentClass = `pl-${depth * 4}`;

  if (item.children && item.children.length > 0) {
    return (
      <Accordion type="single" collapsible className="w-full" value={isOpen ? item.title : "" } onValueChange={(value) => setIsOpen(value === item.title)}>
        <AccordionItem value={item.title} className="border-b-0">
          <AccordionTrigger 
            className={cn(
              "py-2 px-3 w-full text-left hover:bg-muted/50 rounded-md flex justify-between items-center",
              itemIndentClass,
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

  if (!item.path) {
    return (
      <span className={cn("block py-2 px-3 text-muted-foreground", itemIndentClass)}>
        {item.title}
      </span>
    );
  }
  
  const linkPath = item.path === '/' ? '/' : `/${item.path.replace(/^\//, '')}`;

  return (
    <Link
      href={linkPath}
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
