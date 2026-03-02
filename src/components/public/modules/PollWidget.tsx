'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';

export interface PollWidgetProps {
    id?: string;
    moduleId?: string;
    creatorId: string;
    question: string;
    options: string[]; // Hasta 4 opciones
    results?: Record<string, number>;
    isPreview?: boolean;
}

export default function PollWidget({ id, moduleId, creatorId, question, options: initialOptions, results: dbResults, isPreview }: PollWidgetProps) {
    const activeId = moduleId || id || '';
    const [hasVoted, setHasVoted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [totalVotes, setTotalVotes] = useState(0);
    const [results, setResults] = useState<Record<string, number>>(dbResults || {});

    // Real-time listener para actualizaciones en vivo
    useEffect(() => {
        // Bloqueo de variables indefinidas y prevención de rutas malformadas
        if (!creatorId || typeof creatorId !== 'string' || creatorId.includes('undefined')) return;
        if (!activeId || typeof activeId !== 'string' || activeId.includes('undefined') || activeId.startsWith('temp-')) return;

        // Chequear localStorage
        const voted = localStorage.getItem(`voted_${activeId}`);
        if (voted) {
            setHasVoted(true);
        }

        const pollRef = doc(db, 'creators', creatorId, 'modules', activeId);

        const unsubscribe = onSnapshot(
            pollRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (data && data.props) {
                        const freshResults = data.props.results || {};
                        setResults((prev) => {
                            const isEqual = JSON.stringify(prev) === JSON.stringify(freshResults);
                            return isEqual ? prev : freshResults;
                        });

                        let total = data.props.totalVotes || 0;
                        if (total === 0) {
                            Object.values(freshResults).forEach((val: any) => total += val);
                        }
                        setTotalVotes((prev) => prev !== total ? total : prev);
                    }
                }
            },
            (error) => {
                console.error("[FIREBASE DEBUG] Fallo onSnapshot en módulo: poll | ID:", activeId, " | Creador:", creatorId, " | Error:", error.message);
            }
        );

        return () => unsubscribe();
    }, [id, creatorId]);

    const handleVote = async (optionIndex: number) => {
        if (!moduleId || isPreview) {
            toast("¡Se ve genial! Los votos se activarán en tu perfil público.", { icon: '📊' });
            return;
        }
        if (hasVoted || isSubmitting) return;

        setIsSubmitting(true);
        console.log("Votando en Poll ID:", activeId, "Opción Índex:", optionIndex);

        try {
            const res = await fetch('/api/polls/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId, moduleId: activeId, optionIndex })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Error registrando el voto");
            }

            const data = await res.json();
            if (data.success) {
                localStorage.setItem(`voted_${activeId}`, 'true');
                setHasVoted(true);
            }
        } catch (error) {
            console.error("Error capturado en handleVote:", error);
            toast.error("Error al registrar voto. Intenta nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPercentage = (optionIndex: number) => {
        if (totalVotes === 0) return 0;
        const votes = results[optionIndex.toString()] || 0;
        return Math.round((votes / totalVotes) * 100);
    };

    return (
        <div className="w-full bg-gray-900/60 backdrop-blur-md rounded-3xl p-6 border border-gray-800 shadow-xl relative overflow-hidden my-4 group">
            <h3 className="text-xl font-bold text-white mb-6 leading-snug">{question}</h3>

            <div className="space-y-3">
                {initialOptions.map((option, index) => {
                    const percentage = getPercentage(index);
                    const votes = results[index.toString()] || 0;

                    return (
                        <div key={index} className="relative">
                            {!hasVoted ? (
                                <button
                                    onClick={() => handleVote(index)}
                                    disabled={isSubmitting}
                                    className="w-full text-left bg-gray-800/50 hover:bg-gray-700/80 border border-gray-700/50 rounded-2xl p-4 transition-all duration-300 font-medium text-white shadow-sm flex items-center justify-between group-hover:border-purple-500/30"
                                >
                                    <span>{option}</span>
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-600 group-hover:border-purple-500 opacity-50"></div>
                                </button>
                            ) : (
                                <div className="relative w-full bg-gray-800/30 rounded-2xl overflow-hidden border border-gray-700/30">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600/50 to-blue-500/50"
                                    ></motion.div>
                                    <div className="relative p-4 flex justify-between items-center z-10 w-full text-white">
                                        <span className="font-semibold drop-shadow-md z-10 flex-1 truncate pr-2">{option}</span>
                                        <span className="font-bold text-sm drop-shadow-md z-10">{percentage}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {hasVoted && (
                <p className="text-center text-xs text-gray-500 mt-5 font-medium uppercase tracking-wider">
                    {totalVotes} votos registrados
                </p>
            )}
        </div>
    );
}
