import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];

        if (!adminAuth || !adminStorage || !adminDb) {
            return NextResponse.json({ error: "Firebase Admin no inicializado" }, { status: 500 });
        }

        const decodedToken = await adminAuth.verifyIdToken(token);
        if (!decodedToken) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401 });
        }
        const userId = decodedToken.uid;

        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) {
            return NextResponse.json({ error: "No se proporcionó imagen" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            return NextResponse.json({ error: "Bucket no configurado" }, { status: 500 });
        }

        const bucket = adminStorage.bucket(bucketName);
        const ext = file.name.split('.').pop() || 'png';
        const filePath = `profile_pictures/${userId}/${Date.now()}.${ext}`;
        const fileRef = bucket.file(filePath);

        await fileRef.save(buffer, {
            metadata: { contentType: file.type }
        });

        await fileRef.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        await adminDb.collection("creators").doc(userId).update({
            "avatarUrl": publicUrl
        });

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error("Error subiendo imagen:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
