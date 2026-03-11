import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Términos y Condiciones | Nuxira',
    description: 'Términos de servicio para el uso de la plataforma Nuxira.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-[#c2cdff]/30 selection:text-white">
            {/* Header simple */}
            <header className="border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#c2cdff] to-[#00FFCC] p-[1px]">
                            <div className="w-full h-full bg-[#050505] rounded-lg flex items-center justify-center group-hover:bg-[#050505]/80 transition-colors">
                                <span className="text-transparent bg-clip-text bg-gradient-to-tr from-[#c2cdff] to-[#00FFCC] font-bold">NX</span>
                            </div>
                        </div>
                        <span className="text-white font-medium tracking-wide">Nuxira</span>
                    </Link>
                    <nav>
                        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Volver al inicio
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
                <div className="space-y-12">

                    <header className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                            Términos y Condiciones
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Última actualización: {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric', day: 'numeric' })}
                        </p>
                    </header>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar Nuxira, aceptas estar sujeto a estos Términos y Condiciones.
                            Si no estás de acuerdo con alguna parte de los términos, no podrás acceder al servicio.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white">2. Uso de la Plataforma</h2>
                        <p>
                            Te comprometes a utilizar Nuxira de conformidad con la ley, la moral y el orden público.
                            Queda estrictamente prohibido usar la plataforma para:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400">
                            <li>Distribuir contenido ilegal, ofensivo, o que infrinja derechos de terceros.</li>
                            <li>Realizar actividades de spam, phishing o distribución de malware.</li>
                            <li>Suplantar la identidad de otras personas o entidades.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white">3. Cuentas de Usuario</h2>
                        <p>
                            Eres responsable de mantener la confidencialidad de tu cuenta y de todas las actividades
                            que ocurran en ella. Nos reservamos el derecho de suspender o cancelar cuentas que violen
                            estos términos.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white">4. Propiedad Intelectual</h2>
                        <p>
                            El diseño, código, logotipos y contenido original de Nuxira son propiedad exclusiva de
                            la plataforma. Tú mantienes todos los derechos sobre el contenido (enlaces, textos, imágenes)
                            que agregues a tu perfil.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white">5. Limitación de Responsabilidad</h2>
                        <p>
                            Nuxira se proporciona "tal cual". No garantizamos que el servicio sea ininterrumpido
                            o libre de errores. No seremos responsables por daños indirectos derivados del uso
                            de la plataforma.
                        </p>
                    </section>

                    <section className="space-y-4 pt-8">
                        <h2 className="text-2xl font-semibold text-white">Contacto</h2>
                        <p>
                            Para dudas legales, escríbenos a:
                        </p>
                        <a
                            href="mailto:legal@nuxira.me"
                            className="inline-block mt-2 text-[#c2cdff] hover:text-white transition-colors"
                        >
                            legal@nuxira.me
                        </a>
                    </section>

                </div>
            </main>

            {/* Footer simple */}
            <footer className="border-t border-white/5 bg-[#050505] py-8 mt-12">
                <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-4 text-center text-gray-500 text-sm">
                    <div>&copy; {new Date().getFullYear()} Nuxira. Todos los derechos reservados.</div>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
