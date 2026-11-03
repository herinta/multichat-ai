import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/agent/publish - Publish an agent to Explore
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId, description } = await req.json();
    if (!agentId) {
      return NextResponse.json({ error: "Missing agentId" }, { status: 400 });
    }

    // Update agent to public
    const { data, error } = await supabase
      .from('agents')
      .update({
        is_public: true,
        description: description || "",
        creator_id: user.id
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      console.error("Publish agent error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, agent: data });
  } catch (err: any) {
    console.error("Publish route error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
