'use client';

import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

interface VerificationBadgeZoneProps {
    creatorData: any;
}

const CATEGORIES = [
    { value: '', label: 'Elige tu categoría...' },
    { value: 'Músico', label: '🎵 Músico' },
    { value: 'Artista', label: '🎨 Artista' },
    { value: 'Streamer', label: '🎮 Streamer' },
    { value: 'Podcaster', label: '🎙️ Podcaster' },
    { value: 'Influencer', label: '📱 Influencer' },
    { value: 'Educator', label: '📚 Educador/a' },
    { value: 'Otro', label: '✨ Otro' },
];

export default function VerificationBadgeZone({ creatorData }: VerificationBadgeZoneProps) {
    const [status, setStatus] = useState<'none' | 'pending' | 'verified'>('none');
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [socialUrl, setSocialUrl] = useState('');
    const [category, setCategory] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            if (!creatorData?.uid) return;

            if (creatorData.isVerified) {
                setStatus('verified');
                setIsLoading(false);
                return;
            }

            try {
                const requestRef = doc(db, 'verification_requests', creatorData.uid);
                const requestSnap = await getDoc(requestRef);

                if (requestSnap.exists() && requestSnap.data().status === 'pending') {
                    setStatus('pending');
                } else {
                    setStatus('none');
                }
            } catch (error) {
                console.error("Error comprobando estado de verificación:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkStatus();
    }, [creatorData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes (JPG, PNG, etc.)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no puede superar los 5 MB.');
            return;
        }
        setProofFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setProofPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!creatorData?.uid || !auth.currentUser) return;
        if (!socialUrl || !category || !proofFile) {
            toast.error('Todos los campos son obligatorios.');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload proof image to Firebase Storage
            const timestamp = Date.now();
            const storageRef = ref(storage, `verification_proofs/${creatorData.uid}_${timestamp}`);
            await uploadBytes(storageRef, proofFile, { contentType: proofFile.type });
            const proofImageUrl = await getDownloadURL(storageRef);

            // 2. Write/update document in verification_requests collection
            const requestRef = doc(db, 'verification_requests', creatorData.uid);
            await setDoc(requestRef, {
                uid: creatorData.uid,
                username: creatorData.username,
                email: creatorData.email || 'Sin email',
                socialUrl,
                category,
                proofImageUrl,
                status: 'pending',
                submittedAt: serverTimestamp(),
            });

            setStatus('pending');
            setShowForm(false);
            toast.success('¡Solicitud enviada! Revisaremos tus pruebas y te notificaremos pronto. ✅', { duration: 5000 });
        } catch (error) {
            console.error("Error al solicitar verificación:", error);
            toast.error("Ocurrió un error al enviar tu solicitud. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="animate-pulse bg-gray-800/50 h-24 rounded-3xl" />;

    return (
        <div className="bg-[#0f0f0f] border border-[#00FFCC]/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Neon glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00FFCC]/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">
                {/* Header row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0 pr-0 md:pr-4">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            Insignia de Verificación <span className="text-[#00FFCC] bg-white/10 p-1 rounded-full text-xs shrink-0">✔️</span>
                        </h3>
                        <p className="text-sm text-gray-400">
                            Demuestra la autenticidad de tu perfil y obtén la palomita azul junto a tu nombre.
                        </p>
                    </div>

                    <div className="w-full md:w-auto md:max-w-[250px] mt-4 md:mt-0 shrink-0">
                        {status === 'verified' && (
                            <div className="w-full px-4 md:px-6 py-3 bg-[#00FFCC]/10 border border-[#00FFCC]/30 text-[#00FFCC] font-bold rounded-xl text-center flex items-center justify-center gap-2 flex-wrap text-sm md:text-base">
                                <span className="text-balance">Cuenta verificada</span>
                                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            </div>
                        )}
                        {status === 'pending' && (
                            <div className="h-full w-full px-4 md:px-6 py-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-bold rounded-xl text-center flex items-center justify-center flex-wrap text-sm md:text-base">
                                <span className="text-balance leading-tight max-w-[200px] block m-auto">Solicitud enviada y en revisión ⏳</span>
                            </div>
                        )}
                        {status === 'none' && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="w-full md:w-auto px-6 py-3 bg-black border border-[#00FFCC]/50 text-[#00FFCC] font-bold rounded-xl hover:bg-[#00FFCC] hover:text-black hover:shadow-[0_0_20px_rgba(0,255,204,0.4)] transition-all"
                            >
                                Solicitar Verificación
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Expandable Proof Form ── */}
                {showForm && status === 'none' && (
                    <form onSubmit={handleSubmit} className="mt-6 border-t border-gray-800 pt-6 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                        <p className="text-sm text-gray-400">
                            Necesitamos verificar que eres el dueño real de tus redes sociales. Todos los campos son obligatorios.
                        </p>

                        {/* Social URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                🔗 Enlace a tu red social principal
                            </label>
                            <input
                                type="url"
                                required
                                value={socialUrl}
                                onChange={(e) => setSocialUrl(e.target.value)}
                                placeholder="https://instagram.com/tunombre"
                                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00FFCC]/50 transition-colors"
                            />
                            <p className="text-xs text-gray-500 mt-1">Instagram, TikTok, YouTube, Twitch, Spotify, etc.</p>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                🎭 ¿Qué tipo de creador eres?
                            </label>
                            <select
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00FFCC]/50 transition-colors appearance-none"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value} disabled={c.value === ''}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Proof Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                📸 Captura de pantalla como prueba
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Sube una captura donde se vea que estás logueado en esa cuenta (ej. pantalla de "Editar Perfil"). Máx. 5 MB.
                            </p>
                            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-[#00FFCC]/50 hover:bg-gray-800/40 transition-all overflow-hidden relative">
                                {proofPreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={proofPreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-1" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-sm font-medium">Haz clic para subir imagen</span>
                                        <span className="text-xs">JPG, PNG, WEBP</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    required
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                            {proofFile && (
                                <p className="text-xs text-[#00FFCC] mt-1">✓ {proofFile.name}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setProofFile(null); setProofPreview(null); setSocialUrl(''); setCategory(''); }}
                                className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors text-sm font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 rounded-xl bg-[#00FFCC] text-black font-black hover:shadow-[0_0_20px_rgba(0,255,204,0.4)] transition-all disabled:opacity-50 text-sm"
                            >
                                {isSubmitting ? 'Enviando pruebas...' : 'Enviar Solicitud ✅'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
