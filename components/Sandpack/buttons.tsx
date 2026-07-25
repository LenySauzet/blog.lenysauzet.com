'use client';

import {
  UnstyledOpenInCodeSandboxButton,
  useSandpack,
  useSandpackConsole,
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

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// grid place-items-center + shrink-0 keep the icon dead-centre. The plain
// `transition` utility is deliberate: Tailwind v4's scale-* sets the individual
// `scale` property, not `transform`, so a `transition-[transform,...]` never
// animated it (the scale looked raw). `transition` covers scale/translate/rotate.
// will-change promotes a compositor layer so the 200ms scale feedback stays smooth.
const toolbarButton =
  'grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground [will-change:transform] transition duration-200 ease-out hover:scale-110 hover:bg-foreground/[0.08] hover:text-foreground active:scale-95 focus-visible:scale-110 focus-visible:bg-foreground/[0.08] focus-visible:text-foreground focus-visible:outline-none';

// The shared tooltip inverts to the foreground colour; recolour it to the code
// surface as a dark popover (its arrow is dropped via hideArrow).
const tooltipClass =
  'border border-[var(--code-border)] bg-[var(--code-bg)] text-foreground';

// Tooltip + hover/press feedback, shared by every toolbar control.
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
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(toolbarButton, className)}
        >
          <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} hideArrow className={tooltipClass}>{label}</TooltipContent>
    </Tooltip>
  );
}

// Centered play overlay, shown until the bundler is running.
export function RunButton() {
  const { sandpack } = useSandpack();
  if (sandpack.status === 'running') return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Run"
          onClick={sandpack.runSandpack}
          className="pointer-events-auto grid size-11 cursor-pointer place-items-center rounded-full border border-[var(--code-border)] bg-[var(--code-bg)] text-foreground shadow-md [will-change:transform] transition duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HugeiconsIcon icon={PlayIcon} size={20} strokeWidth={2} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} hideArrow className={tooltipClass}>Run</TooltipContent>
    </Tooltip>
  );
}

export function RefreshButton() {
  const { refresh } = useSandpackNavigation();
  return <IconToolbarButton icon={ArrowReloadHorizontalIcon} label="Refresh pane" onClick={refresh} />;
}

export function OpenInCodeSandboxButton() {
  // Sandpack's button spreads incoming props AFTER its own submit onClick, so a
  // Radix trigger applied directly would clobber it. Wrap it (as Maxime does)
  // so the trigger's handlers land on the span and the submit stays intact.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <UnstyledOpenInCodeSandboxButton aria-label="Open in CodeSandbox" className={toolbarButton}>
            <HugeiconsIcon icon={Layers01Icon} size={16} strokeWidth={2} />
          </UnstyledOpenInCodeSandboxButton>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} hideArrow className={tooltipClass}>Open in CodeSandbox</TooltipContent>
    </Tooltip>
  );
}

export function ToggleCodeButton({ onClick }: { onClick: () => void }) {
  return <IconToolbarButton icon={FileScriptIcon} label="Toggle code" onClick={onClick} />;
}

export function ClearConsoleButton({ onClear }: { onClear: () => void }) {
  const { reset } = useSandpackConsole({ resetOnPreviewRestart: true });
  return (
    <IconToolbarButton
      icon={Delete02Icon}
      label="Clear console"
      onClick={() => {
        reset();
        onClear();
      }}
    />
  );
}
