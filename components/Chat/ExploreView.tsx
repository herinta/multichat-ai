"use client";

import { useState, useEffect } from "react";
import { Agent } from "@/types/chat";
import { Button } from "@/components/Modern/Button";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/Modern/Toast";

interface ExploreViewProps {
  currentUser: { id: string } | null;
  onStartChat: (agent: Agent) => Promise<void>;
  onBack?: () => void;
}

interface ExploreAgent extends Agent {
  likeCount?: number;
  isLiked?: boolean;
}

export function ExploreView({ currentUser, onStartChat, onBack }: ExploreViewProps) {
  const [exploreAgents, setExploreAgents] = useState<ExploreAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [startingChatFor, setStartingChatFor] = useState<string | null>(null);
  const supabase = createClient();
  const toast = useToast();

  const [activeFilter, setActiveFilter] = useState<"all" | "mine" | "popular">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPublicAgents = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/agent/explore');
        if (!res.ok) throw new Error("Failed to load explore data");
        const data = await res.json();

        if (data.agents) {
          setExploreAgents(data.agents);
        }
        if (data.likedIds) {
          setLikedIds(new Set(data.likedIds));
        }
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

  const filteredAgents = exploreAgents
    .filter(a => {
      if (activeFilter === "mine") {
        return currentUser?.id && a.creator_id === currentUser.id;
      }
      return true;
    })
    .filter(a => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q) ||
        (a.system_prompt || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (activeFilter === "popular") {
        return (b.likeCount || 0) - (a.likeCount || 0);
      }
      return 0;
    });

  const myPublishedCount = currentUser?.id 
    ? exploreAgents.filter(a => a.creator_id === currentUser.id).length 
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all cursor-pointer shrink-0"
                title="Kembali ke Daftar Chat"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore AI</h1>
              <p className="text-gray-500 mt-1 text-xs sm:text-sm">Temukan dan jelajahi karakter AI publik buatan komunitas & Anda sendiri.</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari karakter AI..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-xs"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "all"
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Semua ({exploreAgents.length})
          </button>
          <button
            onClick={() => setActiveFilter("popular")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "popular"
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            🔥 Terpopuler
          </button>
          <button
            onClick={() => setActiveFilter("mine")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "mine"
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            ✨ Buatan Saya ({myPublishedCount})
          </button>
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
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {activeFilter === "mine" ? "Belum Ada Karakter yang Dipublikasikan" : "Tidak Ada Karakter Ditemukan"}
            </h3>
            <p className="text-gray-500 mt-1 mb-6 text-sm">
              {activeFilter === "mine"
                ? "Buka menu 'Contacts', pilih karakter Anda, lalu klik 'Publish' untuk membagikannya ke Explore."
                : "Coba ubah kata kunci pencarian atau filter yang dipilih."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredAgents.map(agent => (
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

                <div className="flex items-center gap-2 mt-2 mb-3">
                  {agent.creator_id === currentUser?.id ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✨ Buatan Anda
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Publik
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
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
                    {startingChatFor === agent.id ? "⏳ Membuka Chat..." : "Mulai Chat"}
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
