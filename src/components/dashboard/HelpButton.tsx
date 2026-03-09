'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ChevronDown, Copy, ExternalLink, LifeBuoy } from 'lucide-react';
import toast from 'react-hot-toast';

interface AccordionItemProps {
    question: string;
    answer: string;
}

const AccordionItem = ({ question, answer }: AccordionItemProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-800">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-4 flex justify-between items-center text-left group"
            >
                <span className="text-gray-200 font-medium group-hover:text-white transition-colors">{question}</span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`}
                />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pb-4 text-gray-400 text-sm leading-relaxed">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function HelpButton() {
    const [isOpen, setIsOpen] = useState(false);

    const faqData = [
        {
            category: "Cuenta y Perfil",
            items: [
                {
                    question: "¿Cómo edito la apariencia de mi perfil?",
                    answer: "Ve a la pestaña de Apariencia en tu Centro de Mando para cambiar el tema, foto y colores."
                },
                {
                    question: "¿Cómo solicito la insignia de verificación?",
                    answer: "En Configuración, haz clic en 'Solicitar Verificación'. Necesitarás enviar un enlace a tu red social principal y una captura de pantalla que demuestre que es tuya."
                },
                {
                    question: "¿Cómo comparto mi perfil en mis redes sociales?",
                    answer: "En la parte superior de tu Centro de Mando verás tu enlace único de Nuxira (ej. nuxira.app/tu_usuario) junto a un botón de copiar. Haz clic para copiarlo y pégalo en la sección de 'Sitio Web' o 'Biografía' de tu Instagram, TikTok, X o YouTube para que tus seguidores puedan ver tu contenido exclusivo."
                }
            ]
        },
        {
            category: "Monetización y Stripe",
            items: [
                {
                    question: "¿Cómo recibo el dinero de mis ventas?",
                    answer: "Debes ir a la pestaña de Pagos y conectar tu cuenta bancaria a través de Stripe. Nosotros tomamos una pequeña comisión y el resto va directo a tu cuenta."
                },
                {
                    question: "¿Qué es el Paywall?",
                    answer: "Es un módulo especial que bloquea contenido exclusivo (enlaces, textos, imágenes). Tus seguidores deben hacer un pago único para desbloquearlo."
                }
            ]
        },
        {
            category: "Interacción",
            items: [
                {
                    question: "¿Cómo respondo preguntas anónimas?",
                    answer: "En la pestaña de Interacción puedes ver los mensajes de tus seguidores. Si decides responder, la pregunta y tu respuesta se harán públicas en tu perfil."
                }
            ]
        }
    ];

    return (
        <>
            {/* Global FAB */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#c2cdff] to-[#00FFCC] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,204,0.4)] hover:shadow-[0_0_30px_rgba(0,255,204,0.6)] hover:scale-110 active:scale-95 transition-all group"
            >
                <LifeBuoy className="w-7 h-7 text-black group-hover:rotate-12 transition-transform" />
            </button>

            {/* Slide-over Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />

                        {/* Drawer content */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0d0d12] border-l border-gray-800 shadow-2xl z-[70] flex flex-col pt-20"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-800">
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight">Centro de Ayuda Nuxira</h2>
                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Asistencia al Creador</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                {faqData.map((section, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <h3 className="text-[#00FFCC] text-xs font-black uppercase tracking-wider mb-4 opacity-80">
                                            {section.category}
                                        </h3>
                                        <div className="space-y-1">
                                            {section.items.map((item, i) => (
                                                <AccordionItem
                                                    key={i}
                                                    question={item.question}
                                                    answer={item.answer}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-12 p-6 bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-gray-800 text-center">
                                    <p className="text-gray-400 text-sm mb-4">¿Aún tienes dudas?</p>
                                    <a
                                        href="mailto:soporte@nuxira.app"
                                        className="inline-block px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Contactar Soporte
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
