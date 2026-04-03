import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();
        
        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const API_TOKEN = process.env.HUGGING_FACE;
        if (!API_TOKEN) {
            return NextResponse.json({ error: "Hugging Face API token not found" }, { status: 500 });
        }

        // Using a more stable and high-quality Text-to-Image model for Neural Visualization
        // Standard T2V models (ModelScope) often return 410 on the new router or require paid endpoints.
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
            {
                headers: { 
                    Authorization: `Bearer ${API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ inputs: prompt }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("HF Error Detail:", errorText);
            return NextResponse.json({ error: "Hugging Face Model is currently loading or restricted. Please try again in a minute." }, { status: response.status });
        }

        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();

        // Return the image as a stream (Neural Dish Render)
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "image/png",
                "Content-Length": buffer.byteLength.toString(),
            },
        });

    } catch (error: any) {
        console.error("Video Generation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
