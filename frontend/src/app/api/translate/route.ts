import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { text } = await request.json();
        const API_TOKEN = process.env.HUGGING_FACE;

        if (!API_TOKEN) {
            return NextResponse.json({ error: "Hugging Face API token not found" }, { status: 500 });
        }

        // Using Helsinki-NLP/opus-mt-en-hi for high-quality English to Hindi translation
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-hi",
            {
                headers: { 
                    Authorization: `Bearer ${API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ inputs: text }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("HF Translation Error:", errorText);
            return NextResponse.json({ error: "Translation model loading. Please retry shortly." }, { status: response.status });
        }

        const result = await response.json();
        // Helsinki model returns [{ translation_text: "hindi text" }]
        const translatedText = result[0]?.translation_text || text;

        return NextResponse.json({ translatedText });
    } catch (error) {
        console.error("Translation Internal Error:", error);
        return NextResponse.json({ error: "Internal translation error" }, { status: 500 });
    }
}
