'use client';
import Logo from '@/components/Logo';
import { ModeToggle } from '@/components/ModeToggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { AnimatePresence, motion } from 'motion/react';
import { redirect, RedirectType } from 'next/navigation';
import { useState } from 'react';

const Dock = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const setIsOpen = useCmdkStore((state) => state.setIsOpen);

  const navigations = [
    { label: 'Index', action: () => redirect('/', RedirectType.replace) },
    { label: 'Lorem', action: () => redirect('/', RedirectType.replace) },
    { label: 'Ipsum', action: () => redirect('/', RedirectType.replace) },
    { label: 'Dolor', action: () => redirect('/', RedirectType.replace) },
  ];

  return (
    <div className="flex items-center gap-1">
      <Logo className="w-6 h-6 mr-3" />
      <Separator orientation="vertical" className="bg-border/60" />
      <ul className="flex items-center">
        {navigations.map((navigation) => (
          <li
            key={navigation.label}
            onClick={navigation.action}
            onMouseEnter={() => setHoveredItem(navigation.label)}
            onMouseLeave={() => setHoveredItem(null)}
            className="cursor-pointer relative px-3 py-1 text-sm font-medium"
          >
            <AnimatePresence>
              {hoveredItem === navigation.label && (
                <motion.div
                  layoutId="dock-hover-bg"
                  className="absolute inset-0 bg-muted rounded-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              )}
            </AnimatePresence>
            <span className="relative z-10">{navigation.label}</span>
          </li>
        ))}
      </ul>
      <Separator orientation="vertical" className="ml-2 mr-1 bg-border/60" />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Open the command palette"
        onClick={() => setIsOpen(true)}
      >
        <kbd className="font-mono text-[0.7rem] tracking-tight">⌘K</kbd>
      </Button>
      <ModeToggle />
    </div>
  );
};

export default Dock;
