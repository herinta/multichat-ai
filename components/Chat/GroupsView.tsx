import { Room } from "@/types/chat";
import { Button } from "@/components/Modern/Button";

interface GroupsViewProps {
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
  onNewGroup: () => void;
}

export function GroupsView({ rooms, onSelectRoom, onNewGroup }: GroupsViewProps) {
  const groupRooms = rooms.filter(r => r.type === "group");

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 p-8 overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Groups</h1>
            <p className="text-gray-500 mt-2">Manage your multi-AI chat rooms.</p>
          </div>
          <Button onClick={onNewGroup} variant="primary" className="shadow-sm">
            + Create Group
          </Button>
        </div>

        {groupRooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Groups Yet</h3>
            <p className="text-gray-500 mt-1 mb-6">Create a room to chat with multiple AI personas at once.</p>
            <Button onClick={onNewGroup} variant="primary">Create Group</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupRooms.map(room => (
              <div key={room.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer" onClick={() => onSelectRoom(room.id)}>
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-sm group-hover:scale-105 transition-transform shrink-0">
                    {room.title.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 truncate">{room.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{room.members.length} members</p>
                  </div>
                </div>
                
                <div className="flex -space-x-3 mb-4">
                  {room.members.slice(0, 5).map((m, i) => (
                    m.avatar_url ? (
                      <img key={i} src={m.avatar_url} alt={m.name} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                    ) : (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {m.name.charAt(0)}
                      </div>
                    )
                  ))}
                  {room.members.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold z-10">
                      +{room.members.length - 5}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 w-full text-right">
                  <span className="text-purple-600 text-sm font-semibold group-hover:text-purple-700">Open Group &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
