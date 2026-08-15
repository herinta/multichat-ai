import { useState, useEffect } from "react";
import { Agent } from "@/types/chat";
import { Button } from "@/components/Modern/Button";
import { createClient } from "@/utils/supabase/client";

interface ExploreViewProps {
  currentUser: { id: string } | null;
  onStartChat: (agent: Agent) => void;
}

export function ExploreView({ currentUser, onStartChat }: ExploreViewProps) {
  const [exploreAgents, setExploreAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchPublicAgents = async () => {
      if (!currentUser) return;
      
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('is_public', true)
          .neq('creator_id', currentUser.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setExploreAgents(data || []);
      } catch (error) {
        console.error("Failed to fetch explore agents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicAgents();
  }, [currentUser, supabase]);

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
          <div className="text-center py-20 text-gray-500">Memuat karakter publik...</div>
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
              <div key={agent.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
                {agent.avatar_url ? (
                  <img src={agent.avatar_url} alt={agent.name} className="w-20 h-20 rounded-full object-cover mb-4 shadow-sm border border-gray-100" />
                ) : (
                  <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-sm">
                    {agent.name.charAt(0)}
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
                <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md mt-2">
                  Publik
                </div>
                <p className="text-xs text-gray-500 mt-3 mb-6 line-clamp-3">
                  {agent.description || agent.system_prompt}
                </p>
                
                <div className="mt-auto w-full">
                  <Button variant="primary" className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 border-none" onClick={() => onStartChat(agent)}>
                    Mulai Chat Baru
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
