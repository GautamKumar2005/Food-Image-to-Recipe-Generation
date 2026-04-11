import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get("imagefile") as File;

        if (!imageFile) {
            return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        // 1. Forward the request to the high-performance Flask backend
        // In the integrated Docker container, Flask runs on 127.0.0.1:5000
        const flaskBackendUrl = "http://127.0.0.1:5000/api/predict_json";
        
        console.log(`[Next.js BRIDGE] Forwarding request to ${flaskBackendUrl}...`);

        const backendFormData = new FormData();
        backendFormData.append("imagefile", imageFile);

        const response = await fetch(flaskBackendUrl, {
            method: "POST",
            body: backendFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Next.js BRIDGE] Flask backend error:", errorText);
            return NextResponse.json(
                { error: "Backend prediction failed", details: errorText }, 
                { status: response.status }
            );
        }

        const parsedData = await response.json();

        // 2. Post-process: Convert image to Base64 for session persistence/UI display
        // (Maintaining the exact output configuration as requested)
        try {
            const arrayBuffer = await imageFile.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
            parsedData.imageUrl = base64Image;
        } catch (imgErr) {
            console.warn("[Next.js BRIDGE] Could not encode image to base64:", imgErr);
        }

        return NextResponse.json(parsedData);

    } catch (error: any) {
        console.error("[Next.js BRIDGE] Global Bridge Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message }, 
            { status: 500 }
        );
    }
}
