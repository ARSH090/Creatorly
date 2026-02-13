"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

// Simple Context-based Select implementation
const SelectContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
    value: string;
    onValueChange: (value: string) => void;
} | null>(null);

export const Select = ({ children, value, onValueChange, defaultValue }: any) => {
    const [open, setOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(defaultValue || "");

    const handleValueChange = (val: string) => {
        setInternalValue(val);
        onValueChange?.(val);
        setOpen(false);
    };

    const currentValue = value !== undefined ? value : internalValue;

    return (
        <SelectContext.Provider value={{ open, setOpen, value: currentValue, onValueChange: handleValueChange }}>
            <div className="relative inline-block w-full text-left">
                {children}
            </div>
        </SelectContext.Provider>
    );
}

export const SelectTrigger = ({ className, children }: any) => {
    const context = React.useContext(SelectContext);
    return (
        <button
            type="button"
            className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            onClick={() => context?.setOpen(!context.open)}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
}

export const SelectValue = ({ placeholder }: any) => {
    const context = React.useContext(SelectContext);
    return (
        <span style={{ pointerEvents: 'none' }}>
            {context?.value || placeholder}
        </span>
    )
}

export const SelectContent = ({ className, children }: any) => {
    const context = React.useContext(SelectContext);
    if (!context?.open) return null;

    return (
        <>
            <div className="fixed inset-0 z-50" onClick={() => context.setOpen(false)} />
            <div className={cn(
                "absolute z-50 mt-1 max-h-96 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
                className
            )}>
                <div className="p-1">{children}</div>
            </div>
        </>
    )
}

export const SelectItem = ({ value, children, className }: any) => {
    const context = React.useContext(SelectContext);
    const isSelected = context?.value === value;

    return (
        <div
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none bg-background hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                isSelected && "bg-accent text-accent-foreground",
                className
            )}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                context?.onValueChange(value);
            }}
        >
            <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
            </span>
            <span className="truncate">{children}</span>
        </div>
    )
}
