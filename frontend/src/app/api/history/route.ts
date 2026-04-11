import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/dbConnect";
import { SearchHistory } from "@/models";
import { authOptions } from "@/lib/auth"; // We'll create this

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, ingredients, recipe, imageUrl } = await req.json();
    await dbConnect();
    
    const newHistory = await SearchHistory.create({
      userId: (session.user as any).id,
      title,
      ingredients,
      recipe,
      imageUrl,
    });

    return NextResponse.json(newHistory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const history = await SearchHistory.find({ userId: (session.user as any).id }).sort({ createdAt: -1 });
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
