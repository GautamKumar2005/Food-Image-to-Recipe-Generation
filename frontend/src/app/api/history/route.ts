import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "../../../lib/mongodb";
import History from "../../../models/History";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // We need the internal ID from our MongoDB User
    // Instead of looking up user every time, we can assume session has it 
    // if we set up the JWT callback correctly (which we did).
    const userId = session.user.id;

    if (!userId) {
        return NextResponse.json({ error: "User profile incompleteness" }, { status: 400 });
    }

    const history = await History.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(history);
  } catch (error: any) {
    console.error("[HISTORY_GET_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, ingredients, recipe, imageUrl } = await req.json();

    await dbConnect();

    const newEntry = await History.create({
      userId: session.user.id,
      title,
      ingredients,
      recipe,
      imageUrl,
    });

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error: any) {
    console.error("[HISTORY_POST_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
