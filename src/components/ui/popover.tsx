"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"
import { useUiStore } from "@/stores"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ nativeButton = false, ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger nativeButton={nativeButton} data-slot="popover-trigger" {...props} />
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  children,
  onKeyDown,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (useUiStore.getState().isRecordingShortcut) {
          return;
        }
        if (closeRef.current) {
          closeRef.current.click();
        }
      }
    };

    const handlePointerDownOutside = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (
        contentRef.current &&
        target &&
        !contentRef.current.contains(target)
      ) {
        if (closeRef.current) {
          closeRef.current.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("pointerdown", handlePointerDownOutside, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("pointerdown", handlePointerDownOutside, true);
    };
  }, []);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          ref={contentRef}
          data-slot="popover-content"
          className={cn(
            "z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-[6px] bg-popover p-2.5 text-sm text-popover-foreground shadow-lg shadow-black/10 ring-1 ring-border outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          onKeyDown={onKeyDown}
          {...props}
        >
          <PopoverPrimitive.Close
            ref={closeRef}
            data-slot="popover-internal-close"
            className="sr-only hidden"
            tabIndex={-1}
            aria-hidden="true"
          />
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}

