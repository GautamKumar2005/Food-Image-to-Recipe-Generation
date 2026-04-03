import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get("imagefile") as File;

        if (!imageFile) {
            return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        // 1. Setup paths
        // Use absolute paths for Docker stability
        const isDocker = process.env.NODE_ENV === "production";
        const rootDir = isDocker ? "/app" : path.resolve(process.cwd(), "..");
        const tempDir = path.join(rootDir, "temp_uploads");
        
        if (!fs.existsSync(tempDir)) {
            try { fs.mkdirSync(tempDir, { recursive: true }); } catch (e) {}
        }

        const tempFilePath = path.join(tempDir, `${Date.now()}_${imageFile.name}`);
        
        // 2. Save the uploaded file temporarily so Python can read it
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(tempFilePath, buffer);

        // 3. Spawn Python process using the bridge script
        const responseData = await new Promise<NextResponse>((resolve) => {
            const pythonCmd = process.platform === "win32" ? "python" : "python3";
            const bridgeScript = path.join(rootDir, "predict_bridge.py");

            console.log(`[Next.js BRIDGE] Running ${pythonCmd} on ${bridgeScript}`);
            
            const pythonProcess = spawn(pythonCmd, [bridgeScript, tempFilePath]);

            let result = "";
            let errorArr = "";

            pythonProcess.stdout.on("data", (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on("data", (data) => {
                errorArr += data.toString();
            });

            pythonProcess.on("close", (code) => {
                if (code !== 0) {
                    console.error("[Next.js BRIDGE] Python Error Exit Code:", code);
                    console.error("[Next.js BRIDGE] ERR:", errorArr);
                    resolve(NextResponse.json({ error: "Failed to process image", details: errorArr }, { status: 500 }));
                    return;
                }

                try {
                    // Search for JSON block between markers
                    const jsonMatch = result.match(/---JSON_START---([\s\S]*?)---JSON_END---/);
                    const finalResult = jsonMatch ? jsonMatch[1].trim() : result.trim();
                    
                    const parsedData = JSON.parse(finalResult);
                    if (parsedData.error) {
                        console.error("[Next.js BRIDGE] Logic Error:", parsedData.error);
                        console.error("[Next.js BRIDGE] Logic Traceback:", parsedData.traceback);
                        resolve(NextResponse.json({ error: parsedData.error, details: parsedData.traceback }, { status: 500 }));
                    } else {
                        resolve(NextResponse.json(parsedData));
                    }
                } catch (e) {
                    console.error("[Next.js BRIDGE] Parse Error:", e);
                    console.error("[Next.js BRIDGE] Raw Result Received:", result);
                    resolve(NextResponse.json({ error: "Invalid response from AI engine" }, { status: 500 }));
                }
            });
        });

        return responseData;

    } catch (error: any) {
        console.error("[Next.js BRIDGE] Global Bridge Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
