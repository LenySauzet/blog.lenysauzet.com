'use client';

import {
  UnstyledOpenInCodeSandboxButton,
  useSandpack,
  useSandpackNavigation,
} from '@codesandbox/sandpack-react';
import {
  ArrowReloadHorizontalIcon,
  Delete02Icon,
  FileScriptIcon,
  Layers01Icon,
  PlayIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Tailwind v4's scale-* sets the `scale` property, not `transform`, so the plain
// `transition` utility is what animates the hover/press feedback.
const toolbarButton =
  'grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground [will-change:transform] transition duration-200 ease-out hover:scale-110 hover:bg-foreground/[0.08] hover:text-foreground active:scale-95 focus-visible:scale-110 focus-visible:bg-foreground/[0.08] focus-visible:text-foreground focus-visible:outline-none';

function ToolbarTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function IconToolbarButton({
  icon,
  label,
  onClick,
  className,
}: {
  icon: IconSvgElement;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <ToolbarTooltip label={label}>
      <button type="button" aria-label={label} onClick={onClick} className={cn(toolbarButton, className)}>
        <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
      </button>
    </ToolbarTooltip>
  );
}

export function RunButton() {
  const { sandpack } = useSandpack();
  if (sandpack.status === 'running') return null;
  return (
    <ToolbarTooltip label="Run">
      <button
        type="button"
        aria-label="Run"
        onClick={sandpack.runSandpack}
        className="pointer-events-auto grid size-11 cursor-pointer place-items-center rounded-full border border-[var(--code-border)] bg-[var(--code-bg)] text-foreground shadow-md [will-change:transform] transition duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <HugeiconsIcon icon={PlayIcon} size={20} strokeWidth={2} />
      </button>
    </ToolbarTooltip>
  );
}

export function RefreshButton() {
  const { refresh } = useSandpackNavigation();
  return <IconToolbarButton icon={ArrowReloadHorizontalIcon} label="Refresh pane" onClick={refresh} />;
}

export function OpenInCodeSandboxButton() {
  // Sandpack's button spreads incoming props AFTER its own submit onClick, so a
  // Radix trigger applied directly would clobber it. The span takes it instead.
  return (
    <ToolbarTooltip label="Open in CodeSandbox">
      <span className="inline-flex">
        <UnstyledOpenInCodeSandboxButton aria-label="Open in CodeSandbox" className={toolbarButton}>
          <HugeiconsIcon icon={Layers01Icon} size={16} strokeWidth={2} />
        </UnstyledOpenInCodeSandboxButton>
      </span>
    </ToolbarTooltip>
  );
}

export function ToggleCodeButton({ onClick }: { onClick: () => void }) {
  return <IconToolbarButton icon={FileScriptIcon} label="Toggle code" onClick={onClick} />;
}

// Clearing remounts SandpackConsole. The hook's own reset() is deliberately not
// called: it clears a separate, non-rendered log instance.
export function ClearConsoleButton({ onClear }: { onClear: () => void }) {
  return <IconToolbarButton icon={Delete02Icon} label="Clear console" onClick={onClear} />;
}
