
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Slide, Flashcard, QuizQuestion, GroundingChunk, StudyPlan } from '../types';
import { decode, decodeAudioData } from './audioUtils';

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Text Generation ---

export const generateText = async (prompt: string, model: 'gemini-2.5-flash' | 'gemini-flash-lite-latest' = 'gemini-2.5-flash'): Promise<string> => {
    const ai = getAi();
    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
    });
    return response.text;
};

export const generateTextWithThinking = async (prompt: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
};

export const explainTopic = async (topic: string): Promise<string> => {
    const prompt = `Explain the following topic in a clear, concise, and easy-to-understand way for a high school student:\n\nTopic: "${topic}"`;
    return generateText(prompt, 'gemini-2.5-flash');
};

// --- Grounded Generation (Search, Plagiarism) ---

export const checkPlagiarism = async (text: string): Promise<{ report: string; sources: GroundingChunk[] | undefined }> => {
    const ai = getAi();
    const prompt = `Analyze the following text for potential plagiarism by finding highly similar content on the web. Provide a brief report on your findings and list the URLs of the most relevant sources. Text:\n\n"${text}"`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    return { report: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
};

// --- Structured Content Generation ---

export const generateSlidesFromText = async (text: string): Promise<Slide[]> => {
    const ai = getAi();
    const prompt = `Based on the following text, create a presentation with a title, content points for each slide, and optional speaker notes. Provide exactly 5 slides.\n\nText: "${text}"`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.ARRAY, items: { type: Type.STRING } },
                        speakerNotes: { type: Type.STRING }
                    },
                    required: ["title", "content"]
                }
            }
        }
    });

    try {
        const jsonString = response.text;
        return JSON.parse(jsonString) as Slide[];
    } catch (e) {
        console.error("Failed to parse slides JSON:", e);
        throw new Error("Could not generate slides. The AI returned an invalid format.");
    }
};

export const generateFlashcardsFromText = async (text: string): Promise<Flashcard[]> => {
    const ai = getAi();
    const prompt = `Create a list of flashcards (term and definition) from the following text:\n\n"${text}"`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        term: { type: Type.STRING },
                        definition: { type: Type.STRING }
                    },
                    required: ["term", "definition"]
                }
            }
        }
    });

    try {
        return JSON.parse(response.text) as Flashcard[];
    } catch (e) {
        console.error("Failed to parse flashcards JSON:", e);
        throw new Error("Could not generate flashcards.");
    }
};

export const generateQuizFromText = async (text: string, count: number): Promise<QuizQuestion[]> => {
    const ai = getAi();
    const prompt = `Create a multiple-choice quiz with ${count} questions based on this text. For each question, provide 4 options and indicate the correct answer.\n\n"${text}"`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING }
                    },
                    required: ["question", "options", "correctAnswer"]
                }
            }
        }
    });

    try {
        return JSON.parse(response.text) as QuizQuestion[];
    } catch (e) {
        console.error("Failed to parse quiz JSON:", e);
        throw new Error("Could not generate a quiz.");
    }
};

export const generateStudyPlan = async (topic: string, durationDays: number): Promise<StudyPlan> => {
    const ai = getAi();
    const prompt = `Create a detailed study plan for the topic "${topic}" to be completed in ${durationDays} days. For each day, provide main topics, specific goals, and a simple daily quiz question with an answer.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Using Pro for better planning
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING },
                    durationDays: { type: Type.INTEGER },
                    dailyTasks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                day: { type: Type.INTEGER },
                                topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                                goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                                quiz: {
                                    type: Type.OBJECT,
                                    properties: {
                                        question: { type: Type.STRING },
                                        answer: { type: Type.STRING }
                                    },
                                    required: ["question", "answer"]
                                }
                            },
                             required: ["day", "topics", "goals", "quiz"]
                        }
                    }
                },
                 required: ["topic", "durationDays", "dailyTasks"]
            }
        }
    });

    try {
        return JSON.parse(response.text) as StudyPlan;
    } catch (e) {
        console.error("Failed to parse study plan JSON:", e);
        throw new Error("Could not generate a study plan.");
    }
};

export const generateConceptMapAsMarkdown = async (text: string): Promise<string> => {
    const prompt = `Generate a concept map in markdown format from the following text. Use indentation with hyphens (-) to show the hierarchy of concepts. Start with the main topic at the top level.\n\nText: "${text}"`;
    return generateText(prompt, 'gemini-2.5-flash');
};

// --- Analysis ---
export const analyzeProgress = async (data: { tasksCompleted: number; tasksTotal: number; topicsStudied: string[] }): Promise<string> => {
    const prompt = `A student has completed ${data.tasksCompleted} out of ${data.tasksTotal} tasks. They have been studying the following topics: ${data.topicsStudied.join(', ')}. Provide a brief, encouraging, and analytical summary of their progress and suggest what they could focus on next.`;
    return generateText(prompt, 'gemini-2.5-flash');
};


// --- Image Generation & Analysis ---

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio as any,
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const analyzeImageContent = async (image: File, prompt: string): Promise<string> => {
    const ai = getAi();
    const imagePart = await fileToGenerativePart(image);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
};

// --- Speech Generation ---

export const generateSpeech = async (text: string): Promise<void> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received.");

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        outputAudioContext,
        24000,
        1,
    );
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContext.destination);
    source.start();
};
