import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/dbConnect";
import { SearchHistory } from "@/models";
import { authOptions } from "@/lib/auth";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const historyItem = await SearchHistory.findOne({ 
        _id: params.id, 
        userId: (session.user as any).id 
    });

    if (!historyItem) {
      return NextResponse.json({ error: "History item not found" }, { status: 404 });
    }

    await SearchHistory.deleteOne({ _id: params.id });

    return NextResponse.json({ message: "History item deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
      // Removing session check to allow public 'Sharable Links'
      await dbConnect();
      const historyItem = await SearchHistory.findOne({ _id: params.id });
  
      if (!historyItem) {
        return NextResponse.json({ error: "History item not found" }, { status: 404 });
      }
  
      return NextResponse.json(historyItem);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
