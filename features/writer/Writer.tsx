import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Loader from '../../components/ui/Loader';
import { generateText, generateTextWithThinking, explainTopic, checkPlagiarism } from '../../services/geminiService';
import { GroundingChunk, WriterMode } from '../../types';

type Engine = 'flash' | 'pro' | 'flash-lite';

const Writer: React.FC = () => {
    const [mode, setMode] = useState<WriterMode>('write');
    const [engine, setEngine] = useState<Engine>('flash');
    const [prompt, setPrompt] = useState('');
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getModeConfig = () => {
        switch (mode) {
            case 'write':
                return { title: 'Essay Generator', promptPlaceholder: 'e.g., Write a 500-word essay about the causes of the American Revolution.', action: 'Generate' };
            case 'enhance':
                return { title: 'Grammar & Style Enhancer', promptPlaceholder: 'Paste your text here to improve its clarity, tone, and readability.', action: 'Enhance' };
            case 'cite':
                return { title: 'Smart Citation Generator', promptPlaceholder: 'e.g., Generate an APA citation for the book "Sapiens: A Brief History of Humankind" by Yuval Noah Harari.', action: 'Cite' };
            case 'research':
                return { title: 'AI Research Assistant', promptPlaceholder: 'e.g., Who won the most medals at the 2024 Paris Olympics?', action: 'Research' };
            case 'explain':
                return { title: 'Topic Explainer', promptPlaceholder: 'e.g., Explain the concept of black holes in simple terms.', action: 'Explain' };
            case 'plagiarism':
                return { title: 'Plagiarism Checker', promptPlaceholder: 'Paste text here to check for potential plagiarism and find similar content online.', action: 'Check' };
        }
    };

    const handleGenerate = async () => {
        const input = (mode === 'enhance' || mode === 'plagiarism') ? text : prompt;
        if (!input) return;

        setIsLoading(true);
        setError('');
        setResult('');
        setSources([]);

        try {
            let responseText;
            let responseSources;
            let fullPrompt = input;

            switch (mode) {
                case 'enhance':
                    fullPrompt = `Please enhance the following text for clarity, grammar, and style:\n\n${input}`;
                    responseText = await generateText(fullPrompt, 'gemini-2.5-flash');
                    break;
                case 'cite':
                    fullPrompt = `Generate a proper academic citation for the following request: ${input}. Provide citations in APA, MLA, and Chicago formats.`;
                    responseText = await generateText(fullPrompt, 'gemini-2.5-flash');
                    break;
                case 'research':
                    // Fix: Corrected destructuring to use 'report' and 'sources' from the 'checkPlagiarism' result, aliasing them to match the existing variable names.
                    const { report: researchText, sources: groundingChunks } = await checkPlagiarism(fullPrompt); // Re-using this as it provides sources
                    responseText = researchText;
                    responseSources = groundingChunks;
                    break;
                case 'explain':
                    responseText = await explainTopic(input);
                    break;
                case 'plagiarism':
                    const { report, sources } = await checkPlagiarism(input);
                    responseText = report;
                    responseSources = sources;
                    break;
                default: // 'write'
                    if (engine === 'pro') {
                        responseText = await generateTextWithThinking(fullPrompt);
                    } else {
                        const model = engine === 'flash-lite' ? 'gemini-flash-lite-latest' : 'gemini-2.5-flash';
                        responseText = await generateText(fullPrompt, model);
                    }
                    break;
            }
            setResult(responseText);
            setSources(responseSources || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const { title, promptPlaceholder, action } = getModeConfig();
    const isPromptMode = !['enhance', 'plagiarism'].includes(mode);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">{title}</h1>
            
            <Card>
                <div className="flex flex-wrap gap-2 mb-4">
                    {(['write', 'enhance', 'explain', 'cite', 'research', 'plagiarism'] as WriterMode[]).map(m => (
                        <Button key={m} variant={mode === m ? 'primary' : 'secondary'} onClick={() => setMode(m)}>{m.charAt(0).toUpperCase() + m.slice(1)}</Button>
                    ))}
                </div>
                
                <Textarea 
                    value={isPromptMode ? prompt : text} 
                    onChange={(e) => isPromptMode ? setPrompt(e.target.value) : setText(e.target.value)} 
                    placeholder={promptPlaceholder}
                    rows={isPromptMode ? 5 : 8}
                />

                 <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                    <div className="flex items-center space-x-2">
                       <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Engine:</span>
                        <select
                            value={engine}
                            onChange={(e) => setEngine(e.target.value as Engine)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            disabled={mode === 'research' || mode === 'plagiarism' || mode === 'explain'}
                        >
                            <option value="flash-lite">Fast</option>
                            <option value="flash">Balanced</option>
                            <option value="pro">Complex (Thinking)</option>
                        </select>
                    </div>
                    <Button onClick={handleGenerate} isLoading={isLoading}>{action}</Button>
                </div>
            </Card>

            {(isLoading || result || error) && (
                <Card>
                    <h2 className="text-2xl font-semibold mb-4">Result</h2>
                    {isLoading && <Loader />}
                    {error && <p className="text-red-500">{error}</p>}
                    {result && <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">{result}</pre>}
                    {sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t dark:border-gray-700">
                            <h3 className="text-lg font-semibold">Sources:</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {sources.map((chunk, index) => (
                                    chunk.web?.uri && <li key={index}><a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">{chunk.web.title || chunk.web.uri}</a></li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default Writer;