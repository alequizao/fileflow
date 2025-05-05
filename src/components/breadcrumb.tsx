
'use client';

import React from 'react';
import Link from 'next/link'; // Use Link for client-side navigation potential, though handled by onClick here
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button

interface BreadcrumbItem {
  id: string | null; // null represents the root
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void; // Callback for navigation
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-1 text-sm text-muted-foreground flex-wrap">
        {items.map((item, index) => (
          <li key={item.id ?? 'root'} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
            )}
            {index === items.length - 1 ? (
              // Current item - not clickable, bold
              <span className="font-medium text-foreground truncate" aria-current="page">
                 {item.id === null && <Home className="inline-block h-4 w-4 mr-1 align-text-bottom" />}
                {item.name}
              </span>
            ) : (
              // Clickable ancestor item
               <Button
                 variant="link"
                 className="p-0 h-auto text-muted-foreground hover:text-foreground hover:no-underline truncate"
                 onClick={(e) => {
                   e.preventDefault(); // Prevent default link behavior
                   onNavigate(item.id);
                 }}
               >
                 {item.id === null && <Home className="inline-block h-4 w-4 mr-1 align-text-bottom" />}
                 {item.name}
               </Button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
