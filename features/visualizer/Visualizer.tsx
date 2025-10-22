
import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Loader from '../../components/ui/Loader';
import { generateImage, generateConceptMapAsMarkdown } from '../../services/geminiService';
import { IconMindMap } from '../../constants';

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
type VisualizerMode = 'image' | 'conceptMap';

const Visualizer: React.FC = () => {
    const [mode, setMode] = useState<VisualizerMode>('image');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [imageUrl, setImageUrl] = useState('');
    const [conceptMap, setConceptMap] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError('');
        setImageUrl('');
        setConceptMap('');

        try {
            if (mode === 'image') {
                const url = await generateImage(prompt, aspectRatio);
                setImageUrl(url);
            } else {
                const map = await generateConceptMapAsMarkdown(prompt);
                setConceptMap(map);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
                {mode === 'image' ? 'Image Generator' : 'Concept Map Generator'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
                {mode === 'image'
                    ? 'Create educational diagrams, charts, or concept illustrations.'
                    : 'Transform text into a hierarchical concept map.'
                }
            </p>

            <Card>
                <div className="flex space-x-2 mb-4">
                    <Button variant={mode === 'image' ? 'primary' : 'secondary'} onClick={() => setMode('image')}>Image</Button>
                    <Button variant={mode === 'conceptMap' ? 'primary' : 'secondary'} onClick={() => setMode('conceptMap')}>Concept Map</Button>
                </div>

                <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={mode === 'image'
                        ? "e.g., A vibrant diagram of the water cycle with clear labels."
                        : "e.g., Paste a paragraph about photosynthesis to create a concept map."
                    }
                    rows={mode === 'image' ? 3 : 6}
                />
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                    {mode === 'image' ? (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Aspect Ratio:</span>
                            <select
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            >
                                <option value="16:9">16:9 (Landscape)</option>
                                <option value="9:16">9:16 (Portrait)</option>
                                <option value="1:1">1:1 (Square)</option>
                                <option value="4:3">4:3</option>
                                <option value="3:4">3:4</option>
                            </select>
                        </div>
                    ) : <div />}
                    <Button onClick={handleGenerate} isLoading={isLoading}>
                        {mode === 'image' ? 'Generate Image' : <><IconMindMap /> <span className="ml-2">Generate Map</span></>}
                    </Button>
                </div>
            </Card>

            {(isLoading || imageUrl || conceptMap || error) && (
                <Card>
                    <h2 className="text-2xl font-semibold mb-4">Result</h2>
                    {isLoading && <Loader text={mode === 'image' ? "Creating your image..." : "Mapping concepts..."} />}
                    {error && <p className="text-red-500">{error}</p>}
                    {imageUrl && (
                        <div className="flex flex-col items-center">
                            <img src={imageUrl} alt="Generated content" className="rounded-lg shadow-md max-w-full" />
                            <a href={imageUrl} download="academia-ai-image.png" className="mt-4">
                                <Button>Download Image</Button>
                            </a>
                        </div>
                    )}
                    {conceptMap && (
                        <pre className="whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">{conceptMap}</pre>
                    )}
                </Card>
            )}
        </div>
    );
};

export default Visualizer;
