"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const DialogContext = React.createContext<{ open: boolean, setOpen: (open: boolean) => void } | null>(null);

export const Dialog = ({ children, open, onOpenChange }: { children: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const isControlled = open !== undefined;
    const currentOpen = isControlled ? open : isOpen;
    const handleOpenChange = (val: boolean) => {
        if (!isControlled) setIsOpen(val);
        onOpenChange?.(val);
    }

    return (
        <DialogContext.Provider value={{ open: currentOpen, setOpen: handleOpenChange }}>
            {children}
        </DialogContext.Provider>
    )
}

export const DialogContent = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => {
    const context = React.useContext(DialogContext);
    if (!context?.open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
            {/* Backdrop overlay — no backdrop-blur to avoid blurring the dialog content */}
            <div
                className="fixed inset-0 bg-black/60 transition-all duration-100 animate-in fade-in-0"
                onClick={() => context.setOpen(false)}
            />
            {/* Dialog content — rendered above the overlay */}
            <div className={cn(
                "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg md:w-full",
                className
            )}>
                {children}
                <button
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    onClick={() => context.setOpen(false)}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            </div>
        </div>
    )
}

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
        {...props}
    />
)

export const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
)

export const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
)

export const DialogTrigger = ({ asChild, children }: { asChild?: boolean, children: React.ReactNode }) => {
    const context = React.useContext(DialogContext);

    return (
        <span onClick={() => context?.setOpen(true)} className="inline-block cursor-pointer">
            {children}
        </span>
    )
}

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
        {...props}
    />
)
