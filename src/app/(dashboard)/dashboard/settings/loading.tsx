import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex h-[400px] w-full items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="ml-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
                Accessing System Configuration...
            </span>
        </div>
    );
}
