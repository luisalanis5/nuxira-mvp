import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Políticas de Privacidad y Eliminación de Datos | Nuxira',
    description: 'Conoce cómo Nuxira protege tu privacidad, los datos que recopilamos, y cómo puedes ejercer tu derecho a eliminarlos.',
};

export default function PrivacyPolicyPage() {
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
                            Políticas de Privacidad
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Última actualización: {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric', day: 'numeric' })}
                        </p>
                    </header>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white">1. Introducción</h2>
                        <p>
                            Bienvenido a Nuxira. En Nuxira ("nosotros", "nuestro" o "la plataforma"), respetamos tu privacidad
                            y estamos fuertemente comprometidos en proteger tus datos personales. Esta Política de Privacidad explica
                            cómo recopilamos, usamos, divulgamos y salvaguardamos tu información cuando visitas nuestra plataforma
                            de centralización de enlaces e identidad digital.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white">2. Información que Recopilamos</h2>
                        <p>
                            Nuxira funciona como una plataforma de identidad simplificada. Para poder ofrecerte el servicio mediante
                            proveedores de autenticación de terceros (OAuth de Google, Meta/Facebook, Apple y X/Twitter),
                            <strong> únicamente recopilamos y almacenamos los siguientes datos esenciales:</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400">
                            <li>Tu <strong>Nombre Público</strong> (para mostrarlo en tu perfil).</li>
                            <li>Tu <strong>Dirección de Correo Electrónico</strong> (como identificador único y medio de comunicación esencial).</li>
                            <li>La <strong>URL de tu Foto de Perfil</strong> (para personalizar tu página).</li>
                        </ul>
                        <p className="p-4 rounded-xl border border-[#c2cdff]/20 bg-[#c2cdff]/5 mt-4 text-sm text-[#c2cdff]">
                            <strong>Nota importante:</strong> Nuxira no tiene acceso a tus contraseñas, mensajes privados,
                            listas de amigos u otra información sensible de tus cuentas de redes sociales. El proceso de login
                            es manejado íntegramente de forma segura por Firebase Authentication.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white">3. Uso de la Información</h2>
                        <p>
                            Usamos tu información exclusivamente para las siguientes finalidades:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400">
                            <li>Crear y gestionar tu cuenta de creador y tu perfil público (nuxira.app/tu-usuario).</li>
                            <li>Permitirte iniciar sesión de manera rápida y segura.</li>
                            <li>Contactarte sobre actualizaciones importantes del servicio o soporte técnico.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white">4. Cookies y Tecnologías de Rastreo</h2>
                        <p>
                            Utilizamos cookies estrictamente necesarias para mantener tu sesión activa y garantizar
                            la seguridad de tu cuenta. No utilizamos cookies de rastreo de terceros para vender publicidad.
                        </p>
                    </section>

                    {/* ESTA ES LA SECCIÓN REQUERIDA POR META / FACEBOOK DEVELOPERS */}
                    <section id="data-deletion" className="space-y-4 pt-8 border-t border-white/10 mt-12 scroll-mt-24">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-2">
                            Privacidad y Control de Usuario
                        </div>
                        <h2 className="text-3xl font-semibold text-white">5. Eliminación de Datos (Data Deletion Instructions)</h2>
                        <p>
                            En Nuxira, tú eres el dueño absoluto de tu información. Si en algún momento decides dejar de usar
                            la plataforma o revocar el acceso previamente concedido mediante Facebook, Apple u otros proveedores,
                            puedes eliminar permanentemente tu cuenta y todos los datos asociados directamente desde tu panel de control.
                        </p>

                        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 sm:p-8 mt-6">
                            <h3 className="text-xl font-medium text-white mb-4">
                                Pasos para eliminar tus datos:
                            </h3>
                            <ol className="list-decimal pl-5 space-y-4 text-gray-300">
                                <li>
                                    Inicia sesión en tu cuenta de Nuxira en <Link href="/login" className="text-[#c2cdff] hover:underline">nuxira.me/login</Link>.
                                </li>
                                <li>
                                    Dirígete a tu <strong>Centro de Mando</strong> (Dashboard).
                                </li>
                                <li>
                                    Navega hasta la pestaña de <strong>Ajustes</strong> (Settings).
                                </li>
                                <li>
                                    Desplázate hacia abajo hasta encontrar la sección denominada <strong>"Danger Zone"</strong> (Zona de Peligro).
                                </li>
                                <li>
                                    Haz clic en el botón rojo <strong>"Eliminar mi cuenta definitivamente"</strong>.
                                </li>
                                <li>
                                    Aparecerá una ventana de confirmación. Por seguridad, deberás escribir la palabra <strong>ELIMINAR</strong> para confirmar tu decisión.
                                </li>
                            </ol>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <h4 className="text-white font-medium mb-2">¿Qué sucede cuando eliminas tu cuenta?</h4>
                                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                                    <li>Tu página pública de Nuxira (nuxira.me/username) dejará de existir inmediatamente.</li>
                                    <li>Todos los enlaces, módulos y analíticas creados se borrarán permanentemente de nuestras bases de datos en Firestore.</li>
                                    <li>Tu registro de usuario de Firebase Authentication (asociado a tu Facebook/Apple ID) será destruido.</li>
                                    <li><strong>Esta acción es irreversible. No guardamos copias de seguridad de tus datos tras la eliminación.</strong></li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 pt-8">
                        <h2 className="text-2xl font-semibold text-white">6. Contacto</h2>
                        <p>
                            Si tienes alguna pregunta o inquietud sobre esta Política de Privacidad, el manejo de tus datos,
                            o si encuentras dificultades técnicas al intentar eliminar tus datos, no dudes en contactarnos:
                        </p>
                        <a
                            href="mailto:privacidad@nuxira.me"
                            className="inline-block mt-2 text-[#c2cdff] hover:text-white transition-colors"
                        >
                            privacidad@nuxira.me
                        </a>
                    </section>

                </div>
            </main>

            {/* Footer simple */}
            <footer className="border-t border-white/5 bg-[#050505] py-8 mt-12">
                <div className="max-w-4xl mx-auto px-6 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} Nuxira. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
}
