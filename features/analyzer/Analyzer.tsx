
import React, { useState, useRef } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { analyzeImageContent } from '../../services/geminiService';

const Analyzer: React.FC = () => {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('Explain what is in this image.');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setAnalysis('');
            setError('');
        }
    };

    const handleAnalyze = async () => {
        if (!image) return;
        setIsLoading(true);
        setError('');
        setAnalysis('');

        try {
            const result = await analyzeImageContent(image, prompt);
            setAnalysis(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Image Analyzer</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Upload homework, worksheets, or notes to get an explanation.</p>

            <Card>
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        {previewUrl ? 'Change Image' : 'Select Image'}
                    </Button>
                    {previewUrl && (
                        <img src={previewUrl} alt="Preview" className="mt-4 max-h-64 rounded-lg shadow-md" />
                    )}
                </div>
                {previewUrl && (
                    <div className="mt-4">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                            rows={2}
                        />
                        <div className="flex justify-end mt-2">
                           <Button onClick={handleAnalyze} isLoading={isLoading} disabled={!image}>Analyze Image</Button>
                        </div>
                    </div>
                )}
            </Card>

            {(isLoading || analysis || error) && (
                <Card>
                    <h2 className="text-2xl font-semibold mb-4">Analysis</h2>
                    {isLoading && <Loader text="Analyzing image..." />}
                    {error && <p className="text-red-500">{error}</p>}
                    {analysis && <p className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">{analysis}</p>}
                </Card>
            )}
        </div>
    );
};

export default Analyzer;
