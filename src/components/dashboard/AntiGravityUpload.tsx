'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
    onUploadComplete: (url: string, key: string, metadata: any) => void;
    onUploadError: (error: string) => void;
    accept?: string;
    maxSize?: number; // in bytes
    type?: string;
}

export default function AntiGravityUpload({
    onUploadComplete,
    onUploadError,
    accept = "video/*,application/pdf",
    maxSize = 100 * 1024 * 1024, // 100MB default
    type = "product_asset"
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > maxSize) {
            setError(`File too large. Max size is ${Math.round(maxSize / (1024 * 1024))}MB`);
            onUploadError("File too large");
            return;
        }

        startUpload(file);
    };

    const startUpload = async (file: File) => {
        setUploading(true);
        setProgress(0);
        setError(null);
        setFileName(file.name);

        try {
            // 1. Get Presigned URL
            const res = await fetch('/api/upload/presigned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    type: type
                })
            });

            if (!res.ok) throw new Error('Failed to get upload URL');
            const { uploadUrl, key, publicUrl } = await res.json();

            // 2. Perform Upload to S3
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', file.type);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const pct = Math.round((e.loaded / e.total) * 100);
                    setProgress(pct);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    setUploading(false);
                    onUploadComplete(publicUrl, key, {
                        name: file.name,
                        size: file.size,
                        mimeType: file.type
                    });
                } else {
                    throw new Error('Upload failed');
                }
            };

            xhr.onerror = () => {
                throw new Error('Network error during upload');
            };

            xhr.send(file);

        } catch (err: any) {
            console.error('Upload Error:', err);
            setError(err.message || 'Upload failed');
            setUploading(false);
            onUploadError(err.message);
        }
    };

    return (
        <div className="w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={accept}
                className="hidden"
            />

            {!uploading && !fileName && (
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload digital asset"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                    className="aspect-video bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center group cursor-pointer hover:border-indigo-500/50 transition-colors focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6">
                        <Upload className="w-10 h-10 text-indigo-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold">Upload Digital Asset</h3>
                    <p className="text-zinc-500 font-medium mt-2 max-w-xs mx-auto">
                        PDFs, Videos, or ZIPs up to {Math.round(maxSize / (1024 * 1024))}MB
                    </p>
                    <button
                        type="button"
                        className="mt-8 bg-white/10 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all"
                    >
                        Browse Files
                    </button>
                </div>
            )}

            {(uploading || fileName) && (
                <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                {uploading ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /> : <Check className="w-5 h-5 text-emerald-400" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold truncate max-w-[200px]">{fileName}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    {uploading ? `Uploading ${progress}%` : 'Upload Complete'}
                                </p>
                            </div>
                        </div>
                        {!uploading && (
                            <button
                                onClick={() => { setFileName(null); setProgress(0); }}
                                className="p-2 hover:bg-white/5 rounded-lg text-zinc-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {uploading && (
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-xs text-rose-400 font-bold bg-rose-400/10 p-3 rounded-xl">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
