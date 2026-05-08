'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Dropdown version for navbar
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
        <i className="bi bi-sun-fill text-sm"></i>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
          {theme === 'dark' ? (
            <i className="bi bi-moon-stars-fill text-violet-400 text-sm"></i>
          ) : theme === 'light' ? (
            <i className="bi bi-sun-fill text-amber-500 text-sm"></i>
          ) : (
            <i className="bi bi-display text-gray-500 text-sm"></i>
          )}
          <span className="sr-only">থিম পরিবর্তন</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
          <i className="bi bi-sun-fill text-amber-500 text-sm mr-2"></i>
          <span>লাইট</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
          <i className="bi bi-moon-stars-fill text-violet-400 text-sm mr-2"></i>
          <span>ডার্ক</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
          <i className="bi bi-display text-gray-500 text-sm mr-2"></i>
          <span>সিস্টেম</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple toggle button version for mobile drawer
export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
        <i className="bi bi-sun-fill text-sm"></i>
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={cycleTheme}
    >
      {theme === 'dark' ? (
        <i className="bi bi-moon-stars-fill text-violet-400 text-sm"></i>
      ) : theme === 'light' ? (
        <i className="bi bi-sun-fill text-amber-500 text-sm"></i>
      ) : (
        <i className="bi bi-display text-gray-500 text-sm"></i>
      )}
    </Button>
  );
}
