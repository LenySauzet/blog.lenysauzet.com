"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

function Command({
  className,
  onKeyDown,
  onPointerDown,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  const [keyed, setKeyed] = React.useState(false)
  return (
    <CommandPrimitive
      data-slot="command"
      data-keyed={keyed ? "" : undefined}
      onKeyDown={(event) => {
        setKeyed(true)
        onKeyDown?.(event)
      }}
      onPointerDown={(event) => {
        setKeyed(false)
        onPointerDown?.(event)
      }}
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl! bg-transparent text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  open,
  onOpenChange,
  onExitComplete,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExitComplete?: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  const still = usePrefersReducedMotion()
  const returnTo = React.useRef<HTMLElement | null>(null)
  const transition = { duration: 0.15, ease: "easeOut" } as const
  // Motion moves the variable, not backdrop-filter, so Tailwind still writes Safari 17's prefixed one.
  const away = { opacity: 0, scale: still ? 1 : 0.95, "--dialog-blur": "0px" }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence onExitComplete={onExitComplete}>
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
            <DialogPrimitive.Content
              data-slot="dialog-content"
              forceMount
              asChild
              onOpenAutoFocus={() => {
                returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                if (returnTo.current?.isConnected) returnTo.current.focus()
              }}
            >
              <Panel
                className={cn(
                  "fixed top-[20%] left-1/2 z-50 w-[600px] max-w-[95vw] -translate-x-1/2 overflow-hidden rounded-xl border border-muted-foreground/15 bg-card/75 text-sm text-popover-foreground outline-none backdrop-blur-(--dialog-blur) backdrop-saturate-[115%]",
                  className
                )}
                initial={away}
                animate={{ opacity: 1, scale: 1, "--dialog-blur": "6px" }}
                exit={away}
                transition={transition}
              >
                <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
                {children}
              </Panel>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

function Panel(props: React.ComponentProps<typeof motion.div>) {
  const present = useIsPresent()
  return (
    <motion.div
      {...props}
      inert={!present}
      onKeyDownCapture={(event) => {
        if (!present && event.key === "Enter") event.stopPropagation()
      }}
    />
  )
}

function CommandInput({
  className,
  hint,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  hint?: React.ReactNode
}) {
  return (
    <div data-slot="command-input-wrapper">
      <div className="flex h-[55px] items-center gap-3 border-b-[1.5px] border-foreground/10 px-[18px]">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full bg-transparent text-base outline-hidden placeholder:text-subtle-foreground sm:text-sm disabled:cursor-not-allowed disabled:opacity-50",
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

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! transition-[scale] duration-100 active:scale-[0.99] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40 data-[disabled=true]:active:scale-100 any-pointer-fine:data-selected:bg-foreground/5 any-pointer-fine:data-selected:text-foreground in-data-keyed:data-selected:bg-foreground/5 in-data-keyed:data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.15rem] any-pointer-fine:data-selected:**:[svg]:text-foreground in-data-keyed:data-selected:**:[svg]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="ml-auto hidden group-data-[checked=true]/command-item:block" />
    </CommandPrimitive.Item>
  )
}

const commandHint =
  "ml-auto truncate pl-6 text-sm font-normal text-subtle-foreground any-pointer-fine:group-data-selected/command-item:text-foreground in-data-keyed:group-data-selected/command-item:text-foreground"

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
        "ml-auto text-xs tracking-widest text-muted-foreground any-pointer-fine:group-data-selected/command-item:text-foreground in-data-keyed:group-data-selected/command-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
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
