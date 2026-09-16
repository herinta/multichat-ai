"use client";

import { useState, useEffect } from "react";
import { Agent } from "@/types/chat";
import { Button } from "@/components/Modern/Button";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/Modern/Toast";

interface ExploreViewProps {
  currentUser: { id: string } | null;
  onStartChat: (agent: Agent) => Promise<void>;
}

interface ExploreAgent extends Agent {
  likeCount?: number;
  isLiked?: boolean;
}

export function ExploreView({ currentUser, onStartChat }: ExploreViewProps) {
  const [exploreAgents, setExploreAgents] = useState<ExploreAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [startingChatFor, setStartingChatFor] = useState<string | null>(null);
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    const fetchPublicAgents = async () => {
      if (!currentUser) return;

      try {
        // Fetch public agents (filter out own agents if logged in)
        let query = supabase
          .from('agents')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        // Only filter out own agents if user is logged in
        if (currentUser?.id) {
          query = query.neq('creator_id', currentUser.id);
        }

        const { data: agents, error } = await query;
        if (error) throw error;

        // Fetch like counts for each agent
        const agentsWithStats: ExploreAgent[] = await Promise.all(
          (agents || []).map(async (agent) => {
            const { count } = await supabase
              .from('agent_likes')
              .select('*', { count: 'exact', head: true })
              .eq('agent_id', agent.id);
            return { ...agent, likeCount: count || 0 };
          })
        );

        // Fetch current user's liked agents
        const { data: userLikes } = await supabase
          .from('agent_likes')
          .select('agent_id')
          .eq('user_id', currentUser.id);

        const likedSet = new Set((userLikes || []).map(l => l.agent_id));
        setLikedIds(likedSet);
        setExploreAgents(agentsWithStats);
      } catch (error) {
        console.error("Failed to fetch explore agents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicAgents();
  }, [currentUser]);

  const handleToggleLike = async (agent: ExploreAgent) => {
    if (!currentUser) return;

    const isCurrentlyLiked = likedIds.has(agent.id);

    // Optimistic update
    setLikedIds(prev => {
      const next = new Set(prev);
      isCurrentlyLiked ? next.delete(agent.id) : next.add(agent.id);
      return next;
    });
    setExploreAgents(prev => prev.map(a =>
      a.id === agent.id
        ? { ...a, likeCount: (a.likeCount || 0) + (isCurrentlyLiked ? -1 : 1) }
        : a
    ));

    try {
      if (isCurrentlyLiked) {
        await supabase
          .from('agent_likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('agent_id', agent.id);
        toast.info(`💔 Unliked ${agent.name}`);
      } else {
        await supabase
          .from('agent_likes')
          .insert({ user_id: currentUser.id, agent_id: agent.id });
        toast.success(`❤️ Liked ${agent.name}`);
      }
    } catch (error) {
      // Revert on error
      setLikedIds(prev => {
        const next = new Set(prev);
        isCurrentlyLiked ? next.add(agent.id) : next.delete(agent.id);
        return next;
      });
      toast.error("Gagal update like. Coba lagi.");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 p-8 overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Explore AI</h1>
            <p className="text-gray-500 mt-2">Temukan karakter AI publik yang dibuat oleh pengguna lain.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : exploreAgents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Belum Ada Karakter</h3>
            <p className="text-gray-500 mt-1 mb-6">Jadilah yang pertama untuk membagikan karakter Anda ke Publik!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exploreAgents.map(agent => (
              <div key={agent.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
                <div className="relative mb-4">
                  {agent.avatar_url ? (
                    <img src={agent.avatar_url} alt={agent.name} className="w-20 h-20 rounded-full object-cover shadow-sm border border-gray-100" />
                  ) : (
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">
                      {agent.name.charAt(0)}
                    </div>
                  )}
                  {/* Like button overlay */}
                  <button
                    onClick={() => handleToggleLike(agent)}
                    className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-sm transition-all ${
                      likedIds.has(agent.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-400 hover:bg-red-50 hover:text-red-400'
                    }`}
                    title={likedIds.has(agent.id) ? "Unlike" : "Like"}
                  >
                    <svg className="w-3.5 h-3.5" fill={likedIds.has(agent.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>

                <div className="flex items-center gap-3 mt-2 mb-3">
                  <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                    Publik
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{agent.likeCount || 0}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-6 line-clamp-3">
                  {agent.description || agent.system_prompt}
                </p>

                <div className="mt-auto w-full">
                  <Button 
                    variant="primary" 
                    className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 border-none" 
                    onClick={async () => {
                      if (startingChatFor) return;
                      setStartingChatFor(agent.id);
                      try {
                        await onStartChat(agent);
                      } finally {
                        setStartingChatFor(null);
                      }
                    }}
                    disabled={startingChatFor === agent.id}
                  >
                    {startingChatFor === agent.id ? "⏳ Membuka Chat..." : "Mulai Chat Baru"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
