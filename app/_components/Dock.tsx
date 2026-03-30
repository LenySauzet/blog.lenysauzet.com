'use client';
import Logo from '@/components/Logo';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'motion/react';
import { redirect, RedirectType } from 'next/navigation';
import { useState } from 'react';

const Dock = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navigations = [
    { label: 'Index', action: () => redirect('/', RedirectType.replace) },
    { label: 'Lorem', action: () => redirect('/', RedirectType.replace) },
    { label: 'Ipsum', action: () => redirect('/', RedirectType.replace) },
    { label: 'Dolor', action: () => redirect('/', RedirectType.replace) },
  ];

  return (
    <div className="flex items-center gap-1">
      <Logo className="w-6 h-6 mr-3" />
      <Separator orientation="vertical" className="bg-muted" />
      <ul className="flex items-center">
        {navigations.map((navigation) => (
          <li
            key={navigation.label}
            onClick={navigation.action}
            onMouseEnter={() => setHoveredItem(navigation.label)}
            onMouseLeave={() => setHoveredItem(null)}
            className="cursor-pointer relative px-3 py-1 text-sm"
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
    </div>
  );
};

export default Dock;
