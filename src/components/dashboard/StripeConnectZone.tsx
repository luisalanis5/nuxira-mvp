'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase/client';
import toast from 'react-hot-toast';

interface StripeConnectZoneProps {
    creatorData: any;
    onUpdate: () => void;
}

export default function StripeConnectZone({ creatorData, onUpdate }: StripeConnectZoneProps) {
    const [loading, setLoading] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const isConnected = !!creatorData?.stripeAccountId;
    const isPremium = !!creatorData?.isPremium;

    const handleConnect = async () => {
        if (!auth.currentUser) return;
        if (!isPremium) {
            toast.error("Debes ser Nuxira Pro para habilitar los Pagos Directos.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/stripe/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: auth.currentUser.uid }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.details || data.error || 'No URL');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Error conectando con Stripe');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToDashboard = async () => {
        if (!auth.currentUser || !isConnected) return;
        setLoading(true);
        try {
            const res = await fetch('/api/stripe/dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: creatorData.stripeAccountId }),
            });

            const data = await res.json();
            if (data.url) {
                window.open(data.url, '_blank');
            } else {
                throw new Error(data.details || data.error || 'No URL');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Error accediendo al Dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!auth.currentUser || !isConnected) return;

        if (!window.confirm("¿Estás seguro de que deseas desconectar tu cuenta de Stripe? Ya no podrás recibir pagos directos.")) {
            return;
        }

        setIsDisconnecting(true);
        try {
            const res = await fetch('/api/stripe/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: auth.currentUser.uid }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Cuenta desconectada exitosamente');
                onUpdate(); // Refrescar datos
            } else {
                throw new Error(data.details || data.error || 'Error desconocido');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Error al desconectar cuenta');
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            {/* Decorative Blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                    <span className="text-2xl drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">🏦</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Pagos y Comisiones</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Recibe el 85% de las ventas de tu Paywall directamente en tu cuenta bancaria a través de Stripe Connect.
                    </p>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <span className="text-gray-400 font-medium text-sm">Estado de la cuenta</span>
                    {isConnected ? (
                        <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 w-fit">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse blur-[1px] shrink-0"></span>
                            <span className="text-center">Verificada en Stripe</span>
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 w-fit">
                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full shrink-0"></span>
                            <span className="text-center">No conectada</span>
                        </span>
                    )}
                </div>

                {!isConnected ? (
                    <div className="text-center p-4">
                        <p className="text-gray-500 text-xs mb-4">Para poder cobrar a tus fans, necesitas verificar tu identidad y asociar una cuenta bancaria mediante la plataforma segura de Stripe.</p>
                        <button
                            onClick={handleConnect}
                            disabled={loading || !isPremium}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Redirigiendo...' : 'Conectar Cuenta Bancaria'}
                            {!isPremium && <span className="ml-2 text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded uppercase tracking-wider">Pro</span>}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleGoToDashboard}
                            disabled={loading || isDisconnecting}
                            className="flex-1 py-3 bg-white hover:bg-gray-100 text-black font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            {loading ? 'Redirigiendo...' : 'Ver Ganancias en Stripe ↗'}
                        </button>
                        <button
                            onClick={handleConnect}
                            disabled={loading || isDisconnecting}
                            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-sm transition-all"
                        >
                            Ajustes Bank
                        </button>
                    </div>
                )}
            </div>

            {/* Disconnect Warning section */}
            {isConnected && (
                <div className="mt-4 flex flex-col items-center justify-center pt-2 border-t border-gray-800">
                    <button
                        onClick={handleDisconnect}
                        disabled={loading || isDisconnecting}
                        className="text-red-500 hover:text-red-400 text-xs font-medium transition-colors underline-offset-4 hover:underline py-2"
                    >
                        {isDisconnecting ? 'Desconectando...' : 'Desconectar cuenta bancaria'}
                    </button>
                    <p className="text-[10px] text-gray-500 text-center max-w-[250px] mt-1">
                        Si desconectas la cuenta bancaria, no podrás cobrar los ingresos de tus módulos premium.
                    </p>
                </div>
            )}

            <div className="flex items-center gap-2 text-[10px] text-gray-500 justify-center mt-3">
                <span>🔒 Pagos asegurados por</span>
                <span className="font-bold text-gray-400">Stripe Express</span>
            </div>
        </div>
    );
}
