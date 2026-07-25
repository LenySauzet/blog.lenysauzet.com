'use client';

import { FullScreenIcon } from '@hugeicons/core-free-icons';

import { cn } from '@/lib/utils';

import {
  ClearConsoleButton,
  IconToolbarButton,
  OpenInCodeSandboxButton,
  RefreshButton,
  ToggleCodeButton,
} from './buttons';

export type Tab = 'preview' | 'console';

interface ToolbarProps {
  selectedTab: Tab;
  onTabSelect: (tab: Tab) => void;
  onToggleCode: () => void;
  onFullscreen: () => void;
  onClear: () => void;
}

export function Toolbar({
  selectedTab,
  onTabSelect,
  onToggleCode,
  onFullscreen,
  onClear,
}: ToolbarProps) {
  const tabButton = (tab: Tab, label: string) => (
    <button
      type="button"
      aria-pressed={selectedTab === tab}
      onClick={() => onTabSelect(tab)}
      className={cn(
        'cursor-pointer rounded-lg border px-3 py-1 text-sm transition-colors',
        selectedTab === tab
          ? 'border-[var(--code-border)] bg-[var(--code-bg)] text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-12 w-full items-center justify-between gap-2 border-b border-[var(--code-border)] bg-[var(--background)] px-2">
      <div className="flex items-center gap-1">
        <ToggleCodeButton onClick={onToggleCode} />
        {tabButton('preview', 'Preview')}
        {tabButton('console', 'Console')}
      </div>
      <div className="flex items-center gap-0.5">
        {selectedTab === 'preview' ? (
          <>
            <IconToolbarButton
              icon={FullScreenIcon}
              label="Fullscreen"
              onClick={onFullscreen}
              className="max-[750px]:hidden"
            />
            <RefreshButton />
            <OpenInCodeSandboxButton />
          </>
        ) : (
          <ClearConsoleButton onClear={onClear} />
        )}
      </div>
    </div>
  );
}
