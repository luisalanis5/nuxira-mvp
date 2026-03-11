'use client';

import React, { useState } from 'react';
import { db, auth, storage } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

export default function FeedbackManager() {
    const [type, setType] = useState<'bug' | 'suggestion' | 'improvement'>('improvement');
    const [message, setMessage] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("La imagen es demasiado grande (máx 5MB)");
                return;
            }
            setScreenshot(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.error("Por favor, escribe un mensaje");
            return;
        }

        setIsSubmitting(true);
        try {
            let screenshotUrl = null;

            if (screenshot && type === 'bug') {
                const storageRef = ref(storage, `feedback/${auth.currentUser?.uid}/${Date.now()}_${screenshot.name}`);
                const uploadResult = await uploadBytes(storageRef, screenshot);
                screenshotUrl = await getDownloadURL(uploadResult.ref);
            }

            await addDoc(collection(db, 'feedback'), {
                userId: auth.currentUser?.uid,
                userEmail: auth.currentUser?.email,
                type,
                message,
                screenshotUrl,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            toast.success("¡Gracias por tu feedback! Lo revisaremos pronto.");
            setMessage('');
            setScreenshot(null);
            setPreviewUrl(null);
            setType('improvement');
        } catch (error) {
            console.error("Error submitting feedback:", error);
            toast.error("Error al enviar. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                💡 Ayúdanos a mejorar Nuxira
            </h3>
            <p className="text-gray-400 text-sm mb-8">
                Tus sugerencias y reportes de errores son vitales para nosotros. Cuéntanos qué piensas o qué falló.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={() => setType('bug')}
                        className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${type === 'bug' ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                        🪲 Reportar Error
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('improvement')}
                        className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${type === 'improvement' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                        🚀 Mejora
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('suggestion')}
                        className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${type === 'suggestion' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                        💡 Sugerencia
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
                        Tu mensaje
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={type === 'bug' ? "¿Qué sucedió? ¿Cómo podemos replicarlo?" : "¿Qué nueva función te gustaría ver?"}
                        rows={5}
                        className="w-full bg-[#0d0d12] border border-gray-800 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00FFCC]/20 focus:border-[#00FFCC]/50 transition-all resize-none"
                    />
                </div>

                {type === 'bug' && (
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 block">
                            Captura de pantalla (Opcional)
                        </label>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => document.getElementById('feedback-screenshot')?.click()}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-colors border border-gray-700"
                            >
                                📷 Subir Imagen
                            </button>
                            <input
                                id="feedback-screenshot"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {screenshot && (
                                <span className="text-xs text-gray-400 truncate max-w-[200px]">
                                    {screenshot.name}
                                </span>
                            )}
                        </div>
                        {previewUrl && (
                            <div className="relative w-full max-w-xs h-40 rounded-xl overflow-hidden border border-gray-800 group">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setScreenshot(null); setPreviewUrl(null); }}
                                    className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-[#00FFCC] to-blue-500 text-black font-black rounded-2xl hover:shadow-[0_0_20px_rgba(0,255,204,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                </button>
            </form>
        </div>
    );
}
