import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import History from "@/models/History";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await dbConnect();

    const entry = await History.findById(id);

    if (!entry) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Note: If you want history to be private, add session check here.
    // However, the Dashboard code currently uses this for SHARING,
    // which implies entries are public via their ID.

    return NextResponse.json(entry);
  } catch (error: any) {
    console.error("[HISTORY_SINGLE_GET_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await dbConnect();
    
    // Optional: Add session check to ensure user owns this record
    await History.findByIdAndDelete(id);

    return NextResponse.json({ message: "Record deleted" });
  } catch (error: any) {
    console.error("[HISTORY_DELETE_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
