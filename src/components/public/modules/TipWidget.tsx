'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export interface TipWidgetProps {
    id: string;
    creatorId?: string;
    title?: string;
    description?: string;
    buttonText?: string;
    suggestedAmount?: number; // En dólares
}

export default function TipWidget({
    id,
    creatorId,
    title = 'Apoya mi contenido',
    description = 'Si te gusta lo que hago, invítame un café ☕',
    buttonText = 'Invítame un café',
    suggestedAmount = 5
}: TipWidgetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [amount, setAmount] = useState<number>(suggestedAmount);

    const handlePayment = async () => {
        if (!creatorId) {
            toast.error('El ID del creador no está disponible.');
            return;
        }

        if (amount < 1) {
            toast.error('El monto mínimo es de $1.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId,
                    amount: amount * 100, // Stripe expects cents
                    currency: 'usd',
                    redirectUrl: window.location.origin + window.location.pathname
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error procesando el pago');
            }

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No se recibió la URL de Stripe');
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            toast.error('Error al iniciar el pago: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-[32px] p-6 text-center shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(255,215,0,0.3)] rotate-3">
                <span className="-rotate-3">⚡</span>
            </div>

            <h3 className="text-white font-bold text-xl mb-2">{title}</h3>
            <p className="text-gray-400 text-sm mb-4 max-w-[80%] mx-auto">{description}</p>

            <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-gray-400 font-bold text-xl">$</span>
                <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={isSubmitting}
                    className="w-24 bg-gray-800 border-b-2 border-gray-600 text-white text-center text-2xl font-bold rounded-t-md p-2 focus:outline-none focus:border-purple-500 transition-colors"
                />
            </div>

            <button
                onClick={handlePayment}
                disabled={isSubmitting}
                className="block w-full min-h-[44px] py-3.5 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-gray-200 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
                {isSubmitting ? 'Iniciando Seguro...' : buttonText}
            </button>
        </div>
    );
}
