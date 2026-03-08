'use client';

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import toast from 'react-hot-toast';

interface WelcomeModalProps {
    onClose: () => void;
}

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
    const [isClosing, setIsClosing] = useState(false);

    const handleStart = async () => {
        if (!auth.currentUser) return;
        setIsClosing(true);

        try {
            const docRef = doc(db, 'creators', auth.currentUser.uid);
            await updateDoc(docRef, {
                hasSeenWelcomeModal: true
            });
            onClose();
        } catch (error) {
            console.error("Error al cerrar modal de bienvenida:", error);
            toast.error("Ocurrió un error. Intenta de nuevo.");
            setIsClosing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className={`bg-[#0d0d12] border border-gray-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative ${isClosing ? 'animate-out fade-out fade-out-0 zoom-out-95 duration-300' : 'animate-in fade-in zoom-in-95 duration-500'}`}>
                {/* Decoración Superior Nav */}
                <div className="h-32 bg-gradient-to-br from-[#c2cdff]/20 to-[#00FFCC]/10 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className="text-6xl drop-shadow-[0_0_20px_rgba(194,205,255,0.8)]">🚀</span>
                    </div>
                </div>

                <div className="p-8">
                    <h2 className="text-2xl font-black text-white text-center mb-6 tracking-tight">
                        ¡Te damos la bienvenida a tu Centro de Mando en Nuxira!
                    </h2>

                    <div className="space-y-6 mb-8">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#15151b] flex items-center justify-center text-xl shadow-inner border border-gray-800">
                                🎨
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Personaliza tu perfil</h3>
                                <p className="text-gray-400 text-sm">Sube tu foto, escribe tu biografía y elige los colores perfectos de tu marca.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#15151b] flex items-center justify-center text-xl shadow-inner border border-gray-800">
                                🔗
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Agrega tus enlaces</h3>
                                <p className="text-gray-400 text-sm">Configura tu contenido exclusivo, redes sociales y métodos de monetización.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#15151b] flex items-center justify-center text-xl shadow-inner border border-gray-800">
                                📢
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Comparte tu URL</h3>
                                <p className="text-gray-400 text-sm">Pega nuxira.app/tu-usuario en tus redes sociales y empieza a conectar con tu audiencia.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={isClosing}
                        className="w-full py-4 bg-gradient-to-r from-[#c2cdff] to-[#00FFCC] text-black font-extrabold rounded-2xl hover:shadow-[0_0_20px_rgba(0,255,204,0.4)] transition-all hover:-translate-y-1 active:scale-95 text-lg flex items-center justify-center gap-2"
                    >
                        {isClosing ? 'Entrando...' : '¡Comenzar!'}
                    </button>
                    <p className="text-center text-gray-500 text-xs mt-4">Tu viaje digital comienza ahora.</p>
                </div>
            </div>
        </div>
    );
}
