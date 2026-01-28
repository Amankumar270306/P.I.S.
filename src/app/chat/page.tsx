"use client";

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatUsers, getChannels, getChatHistory, createChatUser, createChannel, ChatUser, Channel, ChatMessage } from '@/lib/api';
import { Search, Plus, Send, MoreVertical, User, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatPage() {
    // State
    const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');

    // Auth Simulation (Just pick the first user or create one)
    const { data: users, refetch: refetchUsers } = useQuery({ queryKey: ['chatUsers'], queryFn: getChatUsers });
    const { data: channels, refetch: refetchChannels } = useQuery({ queryKey: ['channels'], queryFn: getChannels });

    // Auto-login logic for demo
    useEffect(() => {
        if (users && users.length > 0 && !currentUser) {
            setCurrentUser(users[0]);
        }
    }, [users, currentUser]);

    // WebSocket Connection
    useEffect(() => {
        if (activeChannel && currentUser) {
            // Close old socket
            if (socket) socket.close();

            // Connect new socket
            // URL: ws://localhost:8000/ws/chat/{channel_id}/{user_id}
            const ws = new WebSocket(`ws://localhost:8000/ws/chat/${activeChannel.id}/${currentUser.id}`);

            ws.onopen = () => console.log('Connected to chat');
            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                setRealtimeMessages(prev => [...prev, msg]);
            };
            ws.onclose = () => console.log('Disconnected');

            setSocket(ws);
            setRealtimeMessages([]); // Clear previous local cache, let query fetch history

            return () => {
                ws.close();
            };
        }
    }, [activeChannel, currentUser]);

    // Logic to merge History + Realtime is simplified here: 
    // We display HistoryQuery Data + RealtimeMessages.
    const { data: history } = useQuery({
        queryKey: ['chatHistory', activeChannel?.id],
        queryFn: () => getChatHistory(activeChannel!.id),
        enabled: !!activeChannel
    });

    const allMessages = [...(history || []), ...realtimeMessages];

    // Handlers
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !socket) return;

        socket.send(JSON.stringify({ content: input }));
        setInput('');
    };

    const handleCreateUser = async () => {
        const username = prompt("Enter username:");
        if (username) {
            await createChatUser(username);
            refetchUsers();
        }
    };

    const handleCreateChannel = async () => {
        const name = prompt("Enter group name:");
        if (name) {
            await createChannel(name, true);
            refetchChannels();
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [allMessages]);

    return (
        <div className="flex h-[calc(100vh-theme(spacing.20))] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
                {/* Header */}
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img
                            src={currentUser?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"}
                            className="size-8 rounded-full bg-white border border-slate-200"
                        />
                        <span className="font-semibold text-slate-700">{currentUser?.username || 'Guest'}</span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={handleCreateUser} className="p-2 hover:bg-slate-200 rounded-full text-slate-600" title="Create User">
                            <User className="size-4" />
                        </button>
                        <button onClick={handleCreateChannel} className="p-2 hover:bg-slate-200 rounded-full text-slate-600" title="New Group">
                            <Plus className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search chats..." />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {channels?.map(channel => (
                        <div
                            key={channel.id}
                            onClick={() => setActiveChannel(channel)}
                            className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors ${activeChannel?.id === channel.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''}`}
                        >
                            <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                {channel.is_group ? <Users className="size-5" /> : <User className="size-5" />}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h4 className="font-medium text-slate-800 truncate">{channel.name || 'General Chat'}</h4>
                                <p className="text-xs text-slate-500 truncate">Click to start chatting</p>
                            </div>
                        </div>
                    ))}
                    {(!channels || channels.length === 0) && (
                        <div className="text-center p-8 text-slate-400 text-sm">No channels found. Create one!</div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {activeChannel ? (
                <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                    {/* Pattern Overlay opacity */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4a5568 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />

                    {/* Header */}
                    <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center z-10 px-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                {activeChannel.is_group ? <Users className="size-5" /> : <User className="size-5" />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800">{activeChannel.name}</h3>
                                <p className="text-xs text-slate-500">
                                    {activeChannel.is_group ? 'online' : 'last seen recently'}
                                </p>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                            <MoreVertical className="size-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10">
                        {allMessages.map((msg, i) => {
                            const isMe = msg.sender_id === currentUser?.id;
                            return (
                                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm text-sm relative ${isMe ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'
                                        }`}>
                                        {!isMe && <span className="text-[10px] text-orange-600 font-bold block mb-1">User {msg.sender_id.slice(0, 4)}</span>}
                                        {msg.content}
                                        <span className="text-[10px] text-slate-400 block text-right mt-1">
                                            {format(new Date(msg.created_at), 'HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="bg-slate-50 p-4 border-t border-slate-200 z-10">
                        <form onSubmit={handleSendMessage} className="flex gap-3">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Type a message"
                            />
                            <button type="submit" className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                <Send className="size-5" />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                    <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="size-10 text-slate-300" />
                    </div>
                    <p>Select a chat to start messaging</p>
                </div>
            )}
        </div>
    );
}
