import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET_}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("🧹 Iniciando Cron Job: Limpieza de Usuarios No Verificados...");

        // Buscar usuarios en Auth iterando páginas (máx 1000)
        let nextPageToken;
        let deletedCount = 0;
        const now = Date.now();
        const THIRTY_MINUTES_MS = 30 * 60 * 1000;

        do {
            const listUsersResult: any = await adminAuth?.listUsers(1000, nextPageToken);

            if (listUsersResult && listUsersResult.users) {
                for (const userRecord of listUsersResult.users) {
                    const isPasswordAuth = userRecord.providerData.some((p: any) => p.providerId === 'password');

                    if (isPasswordAuth && !userRecord.emailVerified) {
                        const creationTime = new Date(userRecord.metadata.creationTime).getTime();
                        const timeDiff = now - creationTime;

                        if (timeDiff > THIRTY_MINUTES_MS) {
                            console.log(`🗑️ Eliminando usuario caducado no verificado: ${userRecord.uid} (${userRecord.email})`);

                            // 1. Eliminar de Auth
                            await adminAuth?.deleteUser(userRecord.uid);

                            // 2. Eliminar de Creators (por si acaso llegó a crear algo, aunque bloqueamos el paso)
                            if (adminDb) {
                                await adminDb.collection('creators').doc(userRecord.uid).delete();
                            }

                            deletedCount++;
                        }
                    }
                }
            }
            nextPageToken = listUsersResult?.pageToken;
        } while (nextPageToken);

        return NextResponse.json({
            success: true,
            message: `Cron completado. Se eliminaron ${deletedCount} cuentas no verificadas.`
        });

    } catch (error: any) {
        console.error("❌ Error en Cron Job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
