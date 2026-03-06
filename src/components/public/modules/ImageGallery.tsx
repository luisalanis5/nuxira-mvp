'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import ProtectedImage from '@/components/public/ProtectedImage';

export interface ImageGalleryProps {
    id: string;
    title?: string;
    images: { url: string; alt?: string }[];
}

// Rutea URLs externas a través del proxy para sortear CORS (Google Photos, etc.)
function getSafeImageUrl(url: string): string {
    if (!url) return url;
    // Base64 y URLs Nuxira van directo
    if (url.startsWith('data:') || url.startsWith('/') || url.includes('firebasestorage.googleapis.com')) return url;
    // Rutar todo lo demás por el proxy
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export default function ImageGallery({ title, images }: ImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!images || images.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="w-full my-8 group/gallery">
            <div className="flex items-center justify-between mb-6 px-1">
                {title && (
                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-gradient-to-b from-[#00FFCC] to-blue-500 rounded-full"></span>
                        {title}
                    </h3>
                )}

                {images.length > 2 && (
                    <div className="hidden sm:flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all text-white/50 hover:text-white"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all text-white/50 hover:text-white"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Carrusel Swipeable */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-5 pb-8 snap-x snap-mandatory px-1"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                } as React.CSSProperties}
            >
                {images.map((img, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -10 }}
                        className="flex-shrink-0 w-[280px] h-[380px] relative rounded-[2rem] overflow-hidden snap-center cursor-pointer border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-zinc-900 group"
                        onClick={() => setSelectedImage(img.url)}
                    >
                        {/* Overlay Gradiente */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 z-10" />

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {failedImages.has(idx) ? (
                            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-800 z-5">
                                <span className="text-3xl">🔗</span>
                                <p className="text-[11px] text-zinc-500 text-center px-4">No se puede cargar.<br />Usa una URL directa de imagen.</p>
                            </div>
                        ) : (
                            <ProtectedImage
                                src={getSafeImageUrl(img.url)}
                                alt={img.alt || `Imagen ${idx}`}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                style={{ position: 'absolute', inset: 0 }}
                            />
                        )}

                        {/* Botón Expansión Hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                                <Maximize2 size={24} />
                            </div>
                        </div>

                        {/* Numero de Slide sutil */}
                        <div className="absolute bottom-6 right-6 z-20 text-white/30 font-mono text-xs tracking-widest">
                            {(idx + 1).toString().padStart(2, '0')}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Lightbox con Animaciones */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 sm:p-10 backdrop-blur-2xl"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.button
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-[110]"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={24} />
                        </motion.button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-5xl h-full flex items-center justify-center overflow-hidden rounded-3xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ProtectedImage
                                src={selectedImage}
                                alt="Vista expandida"
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
