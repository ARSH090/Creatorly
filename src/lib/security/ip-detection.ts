import { NextRequest } from "next/server";

export function getIP(req: NextRequest | Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    // Fallback for different platforms
    const realIp = req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip");
    return realIp || "127.0.0.1";
}
