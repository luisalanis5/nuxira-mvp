import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { APP_NAME } from '@/config/brand';

// Inicializar el cliente de Redis apuntando al clúster Serverless de Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const runtime = 'edge'; // Forzar ejecución rápida sin Node.js boot

export async function POST(req: NextRequest) {
  try {
    const { pollId, optionId, creatorId } = await req.json();

    if (!pollId || !optionId) {
      return NextResponse.json({ error: 'Datos de voto inválidos' }, { status: 400 });
    }

    // El truco anti-colapso: Operación Atómica HINCRBY en memoria (O(1))
    // Incrementa el contador exacto de la opción seleccionada sin bloquear
    const redisKey = `poll:${creatorId}:${pollId}`;
    const newCount = await redis.hincrby(redisKey, optionId, 1);

    // Opcional: Registrar al usuario para evitar doble voto (Fire-and-forget pipeline)
    // const ip = req.headers.get('x-forwarded-for') || 'anon';
    // await redis.set(`${redisKey}:voted:${ip}`, "1", { ex: 86400 }); // Expira en 1 día

    return NextResponse.json({
      success: true,
      message: 'Voto registrado a velocidad luz',
      currentCount: newCount // Devolvemos el dato fresco para confirmar al cliente
    }, { status: 200 });

  } catch (error) {
    console.error('Error procesando el voto:', error);
    return NextResponse.json({ error: `Error interno de ${APP_NAME}` }, { status: 500 });
  }
}
