'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface VerificationBadgeZoneProps {
    creatorData: any;
}

export default function VerificationBadgeZone({ creatorData }: VerificationBadgeZoneProps) {
    const [status, setStatus] = useState<'none' | 'pending' | 'verified'>('none');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleRequest = async () => {
        if (!creatorData?.uid) return;
        setIsSubmitting(true);
        try {
            const requestRef = doc(db, 'verification_requests', creatorData.uid);
            await setDoc(requestRef, {
                uid: creatorData.uid,
                username: creatorData.username,
                email: creatorData.email || 'No email',
                status: 'pending',
                requestedAt: serverTimestamp()
            });
            setStatus('pending');
            toast.success("Solicitud enviada. ¡Te notificaremos pronto!", { icon: '✅' });
        } catch (error) {
            console.error("Error al solicitar verificación:", error);
            toast.error("Ocurrió un error. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="animate-pulse bg-gray-800/50 h-24 rounded-3xl" />;

    return (
        <div className="bg-[#0f0f0f] border border-[#00FFCC]/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Fondo decorativo Neon */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00FFCC]/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1 min-w-0 pr-0 md:pr-4">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        Insignia de Verificación <span className="text-[#00FFCC] bg-white/10 p-1 rounded-full text-xs shrink-0">✔️</span>
                    </h3>
                    <p className="text-sm text-gray-400">
                        Demuestra la autenticidad de tu perfil y obtén la codiciada palomita azul junto a tu nombre.
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
                            <span className="text-balance leading-tight max-w-[200px] block m-auto">Esperando a que el Admin te acepte</span>
                        </div>
                    )}
                    {status === 'none' && (
                        <button
                            onClick={handleRequest}
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-6 py-3 bg-black border border-[#00FFCC]/50 text-[#00FFCC] font-bold rounded-xl hover:bg-[#00FFCC] hover:text-black hover:shadow-[0_0_20px_rgba(0,255,204,0.4)] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Enviando...' : 'Solicitar Verificación'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
