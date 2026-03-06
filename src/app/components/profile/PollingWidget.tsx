'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type PollingWidgetProps = {
  creatorId: string;
  pollId: string;
  title: string;
  options: { id: string; label: string; initialVotes: number }[];
  sponsoredBy?: { name: string; brandColor: string };
};

export default function PollingWidget({ creatorId, pollId, title, options, sponsoredBy }: PollingWidgetProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Estado local para los votos (Optimistic UI)
  const [localVotes, setLocalVotes] = useState(options);
  const totalVotes = localVotes.reduce((acc, opt) => acc + opt.initialVotes, 0);

  const handleVote = async (optionId: string) => {
    if (hasVoted) return;

    // 1. Actualización Optimista (UI instantánea, sin esperar al servidor)
    setHasVoted(true);
    setSelectedOption(optionId);

    setLocalVotes(prev => prev.map(opt =>
      opt.id === optionId ? { ...opt, initialVotes: opt.initialVotes + 1 } : opt
    ));

    // 2. Transacción en background hacia la Edge Function de Upstash
    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, pollId, optionId }),
      });
      // El voto ya está asegurado en Redis. 
    } catch (error) {
      console.error("Fallo de red al votar:", error);
      // Aquí revertiríamos el estado si fuera crítico, pero en encuestas toleramos la pérdida silenciosa.
    }
  };

  const isSponsored = !!sponsoredBy;
  const brandColor = sponsoredBy?.brandColor || '#c2cdff'; // Default Nuxira Neon Blue

  return (
    <div className={`relative w-full p-5 rounded-2xl overflow-hidden ${isSponsored ? 'border border-transparent bg-gray-900' : 'bg-gray-800/50 backdrop-blur-md border border-gray-700/50'
      }`}>

      {/* Efecto de marco brillante patrocinado (Volt Rush) */}
      {isSponsored && (
        <div
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{ boxShadow: `inset 0 0 40px ${brandColor}` }}
        />
      )}

      <div className="relative z-10">
        <h2 className="text-xl font-bold mb-4 text-white">
          {title} ⚡
        </h2>

        <div className="space-y-3">
          {localVotes.map((opt) => {
            const percentage = totalVotes === 0 ? 0 : Math.round((opt.initialVotes / (totalVotes + (hasVoted ? 1 : 0))) * 100);
            const isSelected = selectedOption === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => handleVote(opt.id)}
                disabled={hasVoted}
                className="relative w-full text-left p-4 rounded-xl overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: 'rgba(31, 41, 55, 0.4)', // gray-800
                  borderColor: isSelected ? brandColor : 'transparent',
                  borderWidth: isSelected ? '2px' : '0px'
                }}
              >
                {/* La barra de progreso animada por GPU (Framer Motion) */}
                <AnimatePresence>
                  {hasVoted && (
                    <motion.div
                      layoutId={`bar-${opt.id}`}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: `${percentage}%`, opacity: 0.8 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute left-0 top-0 bottom-0 z-0"
                      style={{
                        background: `linear-gradient(90deg, ${brandColor}40, ${brandColor}90)`, // El "Destello Eléctrico"
                        filter: isSelected ? 'drop-shadow(0 0 10px rgba(0,255,204,0.5))' : 'none'
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Texto por encima de la barra */}
                <div className="relative z-10 flex justify-between items-center text-white font-medium">
                  <span>{opt.label}</span>
                  {hasVoted && <span>{percentage}%</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Firma de Patrocinador */}
        {isSponsored && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">Energizado por:</span>
            <span className="text-sm font-bold italic" style={{ color: brandColor }}>
              {sponsoredBy.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
