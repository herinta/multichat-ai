import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/agent/explore - Fetch all public agents with like stats
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch all public agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (agentsError) {
      console.error("Explore fetch error:", agentsError);
      return NextResponse.json({ error: agentsError.message }, { status: 500 });
    }

    const agentList = agents || [];

    // 2. Fetch like counts
    const agentsWithStats = await Promise.all(
      agentList.map(async (agent) => {
        const { count } = await supabase
          .from('agent_likes')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agent.id);

        return {
          ...agent,
          likeCount: count || 0
        };
      })
    );

    // 3. Fetch user's liked agent IDs if logged in
    let likedIds: string[] = [];
    if (user?.id) {
      const { data: userLikes } = await supabase
        .from('agent_likes')
        .select('agent_id')
        .eq('user_id', user.id);

      if (userLikes) {
        likedIds = userLikes.map(l => l.agent_id);
      }
    }

    return NextResponse.json({
      agents: agentsWithStats,
      likedIds,
      currentUserId: user?.id || null
    });
  } catch (err: any) {
    console.error("Explore route error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
