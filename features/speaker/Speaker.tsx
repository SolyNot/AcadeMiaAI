
import React, { useState, useRef, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Loader from '../../components/ui/Loader';
import { generateSpeech } from '../../services/geminiService';
// Fix: Removed non-exported 'LiveSession' type.
import { GoogleGenAI, Modality, Blob } from '@google/genai';
import { encode } from '../../services/audioUtils';

type SpeakerMode = 'tts' | 'stt';

const Speaker: React.FC = () => {
    const [mode, setMode] = useState<SpeakerMode>('tts');
    const [textToSpeak, setTextToSpeak] = useState('');
    const [transcribedText, setTranscribedText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Fix: Replaced 'LiveSession' with 'any' since it's not exported from the library.
    const sessionRef = useRef<any | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    // Fix: Replaced 'LiveSession' with 'any' since it's not exported from the library.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    useEffect(() => {
        // Cleanup on component unmount
        return () => {
            if (sessionRef.current) {
                sessionRef.current.close();
            }
            if(audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, []);

    const handleTts = async () => {
        if (!textToSpeak) return;
        setIsLoading(true);
        setError('');
        try {
            await generateSpeech(textToSpeak);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const startTranscription = async () => {
        setIsRecording(true);
        setTranscribedText('');
        setError('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Fix: Cast window to 'any' to access vendor-prefixed webkitAudioContext for broader browser support.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => console.log('Live session opened.'),
                    onmessage: (message) => {
                         if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setTranscribedText(prev => prev + text);
                        }
                    },
                    onerror: (e) => {
                        console.error('Live session error:', e);
                        setError('An error occurred during transcription.');
                        stopTranscription();
                    },
                    onclose: () => console.log('Live session closed.'),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                }
            });

            sessionRef.current = await sessionPromiseRef.current;

            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                const pcmBlob: Blob = {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);

        } catch (err) {
            setError('Could not start microphone. Please grant permission.');
            setIsRecording(false);
        }
    };

    const stopTranscription = () => {
        setIsRecording(false);
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
             mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Speech Tools</h1>
            
            <Card>
                <div className="flex space-x-2 mb-4">
                    <Button variant={mode === 'tts' ? 'primary' : 'secondary'} onClick={() => setMode('tts')}>Text-to-Speech</Button>
                    <Button variant={mode === 'stt' ? 'primary' : 'secondary'} onClick={() => setMode('stt')}>Speech-to-Text</Button>
                </div>
                {mode === 'tts' ? (
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Speech Generation</h2>
                        <Textarea 
                            value={textToSpeak}
                            onChange={(e) => setTextToSpeak(e.target.value)}
                            placeholder="Enter text to convert to speech..."
                            rows={6}
                        />
                        <div className="flex justify-end mt-4">
                            <Button onClick={handleTts} isLoading={isLoading}>Generate Speech</Button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Transcription</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Click start and begin speaking. Your words will be transcribed below.</p>
                        <div className="flex justify-center">
                            {isRecording ? (
                                <Button variant="danger" onClick={stopTranscription}>Stop Recording</Button>
                            ) : (
                                <Button onClick={startTranscription}>Start Recording</Button>
                            )}
                        </div>
                        <div className="mt-4 p-4 border rounded-lg min-h-[150px] bg-gray-50 dark:bg-gray-800">
                             {transcribedText || <span className="text-gray-400">Waiting for transcription...</span>}
                        </div>
                    </div>
                )}
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </Card>
        </div>
    );
};

export default Speaker;
