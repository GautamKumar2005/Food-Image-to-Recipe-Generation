import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get("imagefile") as File;

        if (!imageFile) {
            return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        // 1. Forward the request to the high-performance Flask backend
        // Use localhost for more stable internal communication
        const flaskBackendUrl = "http://localhost:5000/api/predict_json";
        
        // 1. Pre-flight health check to ensure backend is ready
        try {
            const healthCheck = await fetch("http://localhost:5000/api/health", { signal: AbortSignal.timeout(5000) });
            if (!healthCheck.ok) {
                return NextResponse.json(
                    { error: "AI Engine is still warming up. Please try again in 30 seconds." }, 
                    { status: 503 }
                );
            }
        } catch (hErr) {
            console.warn("[Next.js BRIDGE] Health check failed, backend likely still loading.");
            return NextResponse.json(
                { error: "AI Engine is initializing. Please wait a moment and try again." }, 
                { status: 503 }
            );
        }

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
