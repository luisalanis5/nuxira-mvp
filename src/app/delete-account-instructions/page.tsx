import React from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/config/brand';

export const metadata = {
    title: 'Instrucciones de Eliminación de Datos | Nuxira',
    description: 'Guía paso a paso para eliminar permanentemente tu cuenta y datos asociados en Nuxira.',
};

export default function DeleteDataInstructionsPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-[#c2cdff]/30 selection:text-white flex flex-col">
            {/* Header Minimalista */}
            <header className="border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg border-2 border-[#c2cdff] flex items-center justify-center bg-[#050505] group-hover:bg-[#c2cdff]/10 transition-colors">
                            <span className="text-[#c2cdff] font-bold text-sm tracking-tighter">NX</span>
                        </div>
                        <span className="text-white font-bold tracking-widest text-lg">{APP_NAME}</span>
                    </Link>
                    <nav>
                        <Link href="/" className="text-sm text-[#c2cdff] hover:text-white transition-colors font-medium">
                            Volver al inicio
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-3xl mx-auto px-6 py-16 sm:py-24 w-full">
                <div className="space-y-12">

                    <header className="space-y-4">
                        <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                            Privacidad y Control de Datos
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                            Instrucciones de Eliminación de Datos
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            En {APP_NAME}, el control de tu huella digital es tuyo. Si usaste Facebook, Google, Apple o Correo para registrarte, aquí te explicamos cómo borrar absolutamente todos tus datos de nuestros servidores al instante.
                        </p>
                    </header>

                    <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                        {/* Glow Background Decorativo */}
                        <div className="absolute -top-24 -right-24 w-60 h-60 bg-red-500 rounded-full blur-[100px] opacity-10 pointer-events-none" />

                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#c2cdff] text-[#050505] text-sm">✓</span>
                            Guía Paso a Paso
                        </h2>

                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">

                            {/* Paso 1 */}
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[#0f0f0f] bg-[#c2cdff] text-black font-bold z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    1
                                </div>
                                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl border border-white/5 bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <h3 className="font-bold text-white mb-2">Inicia Sesión</h3>
                                    <p className="text-sm text-gray-400">Accede a tu cuenta de {APP_NAME} utilizando el método con el que te registraste originalmente (Facebook, etc).</p>
                                </div>
                            </div>

                            {/* Paso 2 */}
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[#0f0f0f] bg-[#c2cdff] text-black font-bold z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    2
                                </div>
                                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl border border-white/5 bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <h3 className="font-bold text-white mb-2">Ve al Centro de Mando</h3>
                                    <p className="text-sm text-gray-400">Dirígete a tu Dashboard/Panel de control principal donde administras tu perfil.</p>
                                </div>
                            </div>

                            {/* Paso 3 */}
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[#0f0f0f] bg-[#c2cdff] text-black font-bold z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    3
                                </div>
                                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl border border-white/5 bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <h3 className="font-bold text-white mb-2">Ajustes de Cuenta</h3>
                                    <p className="text-sm text-gray-400">En el menú de pestañas, haz clic en <strong>"Ajustes de Cuenta"</strong>. Ahí encontrarás todas tus configuraciones de seguridad.</p>
                                </div>
                            </div>

                            {/* Paso 4 */}
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[#0f0f0f] bg-red-500 text-black font-bold z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    4
                                </div>
                                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl border border-red-500/20 bg-red-500/5 group-hover:bg-red-500/10 transition-colors">
                                    <h3 className="font-bold text-red-100 mb-2">Danger Zone (Eliminar)</h3>
                                    <p className="text-sm text-gray-400">Busca la sección roja. Haz clic en "Eliminar Cuenta", escribe la palabra <strong>ELIMINAR</strong> para confirmar tu decisión.</p>
                                </div>
                            </div>

                        </div>
                    </div>

                    <section className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 md:p-8 space-y-4">
                        <h2 className="text-xl font-bold text-white">¿Qué sucede al eliminar mi cuenta?</h2>
                        <div className="space-y-3 text-gray-400 text-sm leading-relaxed">
                            <p>El proceso es automático y <strong>permanente</strong>. En el instante en que apruebas la eliminación:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Todo tu perfil público, biografía, foto y temas son eliminados de nuestras bases de datos (Firestore).</li>
                                <li>Todos los enlaces, módulos y analíticas creadas son purgadas irrevocablemente.</li>
                                <li>Tu vínculo de inicio de sesión social (ej. el token de Facebook) es revocado y tu usuario es borrado por completo de Firebase Authentication.</li>
                                <li>La URL pública (`nuxira.me/tualias`) quedará inmediatamente libre para que otra persona pueda registrarla.</li>
                            </ul>
                        </div>
                        <div className="pt-4 mt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-xs text-gray-500">
                                Si requieres ayuda adicional con tus datos, contacta a privacidad@nuxira.me.
                            </p>
                            <Link
                                href="/dashboard/login"
                                className="px-6 py-2 bg-[#c2cdff] text-black font-bold text-sm rounded-xl hover:bg-white transition-colors whitespace-nowrap"
                            >
                                Ir a mi cuenta ahora
                            </Link>
                        </div>
                    </section>

                </div>
            </main>

            {/* Footer Minimalista */}
            <footer className="border-t border-white/5 bg-[#050505] py-8 mt-auto">
                <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-4 text-center text-gray-500 text-sm">
                    <div>&copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.</div>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
                        <Link href="/delete-account-instructions" className="text-[#c2cdff] hover:text-white transition-colors">Eliminación de Datos</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
