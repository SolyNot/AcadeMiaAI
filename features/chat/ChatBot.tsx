
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { ChatMessage, GroundingChunk } from '../../types';
import { IconChat, IconClose, IconSend } from '../../constants';
import Button from '../../components/ui/Button';

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [useMaps, setUseMaps] = useState(false);
    
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !chatRef.current) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
            });
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleGeolocation = (): Promise<{latitude: number; longitude: number} | null> => {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    }),
                    () => resolve(null) // Error or permission denied
                );
            } else {
                resolve(null); // Geolocation not supported
            }
        });
    }

    const handleSend = async () => {
        if (!input.trim() || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError('');
        
        try {
            let modelResponse = '';
            let sources: GroundingChunk[] = [];
            
            if (useMaps) {
                const location = await handleGeolocation();
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: input,
                    config: {
                        tools: [{googleMaps: {}}],
                        toolConfig: location ? { retrievalConfig: { latLng: location } } : undefined
                    },
                });
                modelResponse = response.text;
                sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            } else {
                 const result = await chatRef.current.sendMessage({ message: input });
                 modelResponse = result.text;
            }
           
            if (sources.length > 0) {
                const sourceLinks = sources
                    .map(chunk => (chunk.maps?.uri && `[${chunk.maps.title || 'View on Map'}](${chunk.maps.uri})`))
                    .filter(Boolean)
                    .join('\n');
                modelResponse += `\n\n**Sources:**\n${sourceLinks}`;
            }

            const botMessage: ChatMessage = { role: 'model', content: modelResponse };
            setMessages(prev => [...prev, botMessage]);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred.');
            const errorMessage: ChatMessage = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-50"
            >
                {isOpen ? <IconClose /> : <IconChat />}
            </button>
            {isOpen && (
                <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-8 w-full sm:w-96 h-full sm:h-[600px] bg-white dark:bg-gray-800 shadow-2xl rounded-none sm:rounded-lg flex flex-col z-40">
                    <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-xl font-bold">AI Assistant</h2>
                        <label className="flex items-center cursor-pointer">
                            <span className="mr-2 text-sm">Use Maps</span>
                            <input type="checkbox" checked={useMaps} onChange={() => setUseMaps(!useMaps)} className="toggle-checkbox" />
                        </label>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex justify-start">
                               <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                                   <div className="flex items-center space-x-2">
                                     <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                     <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                                     <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                                   </div>
                               </div>
                           </div>
                         )}
                        <div ref={messagesEndRef} />
                    </div>
                    <footer className="p-4 border-t dark:border-gray-700 flex-shrink-0">
                        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                                placeholder="Ask anything..."
                                className="flex-1 p-2 border rounded-l-lg dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <Button onClick={handleSend} isLoading={isLoading} className="rounded-l-none">
                                <IconSend />
                            </Button>
                        </div>
                    </footer>
                </div>
            )}
        </>
    );
};

export default ChatBot;
