'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function QAManager() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        if (!auth.currentUser) return;
        try {
            const q = query(
                collection(db, 'questions'),
                where('receiverId', '==', auth.currentUser.uid)
            );
            const snaps = await getDocs(q);
            const fetched = snaps.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setQuestions(fetched);
        } catch (err) {
            console.error("Error fetching questions:", err);
            toast.error("Error al cargar los mensajes.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('¿Eliminar este mensaje? Esta acción no se puede deshacer.')) return;
        try {
            await deleteDoc(doc(db, 'questions', id));
            setQuestions(questions.filter(q => q.id !== id));
            toast.success("Mensaje eliminado.");
        } catch (err) {
            toast.error("Error eliminando..");
            console.error(err);
        }
    };

    const handleReply = async (id: string) => {
        if (!replyText.trim()) {
            toast.error("La respuesta no puede estar vacía.");
            return;
        }
        try {
            const docRef = doc(db, 'questions', id);
            await updateDoc(docRef, {
                replyText: replyText.trim(),
                repliedAt: Timestamp.now(),
                isPublic: true
            });

            setQuestions(questions.map(q => q.id === id ? {
                ...q,
                replyText: replyText.trim(),
                repliedAt: Timestamp.now(),
                isPublic: true
            } : q));

            setReplyingTo(null);
            setReplyText('');
            toast.success("¡Respuesta publicada en tu perfil!");
        } catch (err) {
            console.error(err);
            toast.error("Error al publicar la respuesta.");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-t-purple-500 border-gray-700 animate-spin"></div>
        </div>
    );

    return (
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-800 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>💬</span> Mensajes Anónimos (Q&A)
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Responde a tus seguidores. Las respuestas publicadas aparecerán en tu perfil.
                    </p>
                </div>
                <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-3 py-1.5 rounded-full border border-purple-500/30">
                    {questions.length} Mensajes Totales
                </span>
            </div>

            {questions.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/20 rounded-2xl border border-dashed border-gray-700">
                    <span className="text-4xl block mb-4 opacity-50">📭</span>
                    <p className="text-gray-400 font-medium">No tienes mensajes aún.</p>
                    <p className="text-sm text-gray-500 mt-2">¡Comparte tu enlace Nuxira en tus redes para recibir preguntas!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {questions.map(q => (
                        <div key={q.id} className={`p-5 rounded-2xl relative transition-all border shadow-sm ${q.isPublic ? 'bg-purple-900/10 border-purple-500/20' : 'bg-gray-800/40 border-gray-700/80 hover:bg-gray-800/60'}`}>

                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border inline-block ${q.isPublic ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-gray-700/50 text-gray-400 border-gray-600'}`}>
                                    {q.isPublic ? 'Público 👁️' : 'Privado 🔒'}
                                </span>

                                <div className="flex gap-2">
                                    {!q.isPublic && (
                                        <button
                                            onClick={() => {
                                                setReplyingTo(replyingTo === q.id ? null : q.id);
                                                if (replyingTo !== q.id) setReplyText('');
                                            }}
                                            className="p-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500 hover:text-white rounded-lg transition-all text-xs font-bold"
                                        >
                                            {replyingTo === q.id ? 'Cancelar' : 'Responder'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                        title="Eliminar Mensaje"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            <p className="text-white text-lg font-medium leading-relaxed mb-1">"{q.content}"</p>
                            {q.createdAt && (
                                <p className="text-[11px] text-gray-500 font-medium mb-4">
                                    Enviado el {q.createdAt.toDate().toLocaleDateString('es-ES', { dateStyle: 'long' })}
                                </p>
                            )}

                            {/* Mostrar respuesta si ya es pública */}
                            {q.isPublic && q.replyText && (
                                <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-xl relative">
                                    <div className="absolute -top-3 left-4 bg-gray-900 px-2 text-xs font-bold text-purple-400 uppercase tracking-widest">Tu Respuesta</div>
                                    <p className="text-gray-300 text-sm">{q.replyText}</p>
                                </div>
                            )}

                            {/* Formulario de Respuesta (Si se está respondiendo y no es público) */}
                            {replyingTo === q.id && !q.isPublic && (
                                <div className="mt-4 pt-4 border-t border-gray-700 animate-in fade-in slide-in-from-top-2">
                                    <textarea
                                        rows={3}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Escribe tu respuesta aquí. Al publicarla, la pregunta y tu respuesta aparecerán en tu perfil público..."
                                        className="w-full bg-gray-900 border border-purple-500/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none text-white transition-all resize-none placeholder:text-gray-600"
                                    />
                                    <div className="flex justify-end mt-3">
                                        <button
                                            onClick={() => handleReply(q.id)}
                                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
                                        >
                                            Publicar en mi Perfil
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
