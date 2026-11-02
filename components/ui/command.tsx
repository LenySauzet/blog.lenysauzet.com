"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { AnimatePresence, motion } from "motion/react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl! bg-transparent text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

/** How long the dialog takes to come and go, which a command that repaints
    the page waits out. */
const DIALOG_SECONDS = 0.15

// Custom, not from the CLI: Motion animates the dialog rather than the
// primitive's keyframes. Mounting the palette takes a frame of 65 to 85ms and a
// CSS animation is timed from that frame's start, so a 100ms entrance was nine
// tenths done by the time it was first painted; Motion's starts on the frame
// after. The backdrop's radius travels too, not just the opacity: a blurred
// backdrop is as good as fully blurred at an opacity of zero, so fading alone
// held the page blurred to the last frame and then let it snap back. Its rest
// keeps the same function list, or there is nothing to interpolate between.
function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  open,
  onOpenChange,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  const still = usePrefersReducedMotion()
  const transition = { duration: DIALOG_SECONDS, ease: "easeOut" } as const
  const away = {
    opacity: 0,
    scale: still ? 1 : 0.95,
    backdropFilter: "blur(0.5px) saturate(1.15)",
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay data-slot="dialog-overlay" forceMount asChild>
              <motion.div
                className="fixed inset-0 isolate z-50 bg-background/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content data-slot="dialog-content" forceMount asChild>
              <motion.div
                className={cn(
                  "fixed top-[20%] left-1/2 z-50 w-[600px] max-w-[95vw] -translate-x-1/2 overflow-hidden rounded-xl border border-muted-foreground/15 bg-card/75 text-sm text-popover-foreground outline-none",
                  className
                )}
                initial={away}
                animate={{ opacity: 1, scale: 1, backdropFilter: "blur(6px) saturate(1.15)" }}
                exit={away}
                transition={transition}
              >
                <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

// Laid out inline rather than through InputGroup: a bare box with room at its
// end, not a field with an addon floating over it.
function CommandInput({
  className,
  hint,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  /** Room at the end of the row for what the box can do right now. */
  hint?: React.ReactNode
}) {
  return (
    <div data-slot="command-input-wrapper">
      <div className="flex h-[55px] items-center gap-3 border-b-[1.5px] border-foreground/10 px-[18px]">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {hint}
      </div>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-[min(460px,50vh)] scroll-py-2 overflow-x-hidden overflow-y-auto p-2 outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden text-foreground not-first:mt-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-[0.8125rem] **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-subtle-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px w-auto bg-border", className)}
      {...props}
    />
  )
}

// Custom, not from the CLI: rows rest on the body tier and the selected one
// steps up to `--foreground` on a faint wash, the accent being left to what the
// reader chose rather than to where the cursor is. Re-run `add command --diff`
// and re-apply.
function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! transition-[scale] duration-100 active:scale-[0.99] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40 data-[disabled=true]:active:scale-100 data-selected:bg-foreground/5 data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.15rem] data-selected:**:[svg]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="ml-auto hidden group-data-[checked=true]/command-item:block" />
    </CommandPrimitive.Item>
  )
}

/** What a row says on its right: a destination, a date, the accent in force.
    Lifts with the row the way a shortcut does, or the one thing on the line
    that does not answer the selection reads as disabled.

    Exported as a class as well, for a mark that has to be a motion element to
    animate its own exit. */
const commandHint =
  "ml-auto truncate pl-6 text-sm text-muted-foreground/70 group-data-selected/command-item:text-foreground"

function CommandHint({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="command-hint" className={cn(commandHint, className)} {...props} />
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  DIALOG_SECONDS,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandHint,
  commandHint,
  CommandShortcut,
  CommandSeparator,
}
