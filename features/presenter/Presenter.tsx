
import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Loader from '../../components/ui/Loader';
import { generateSlidesFromText } from '../../services/geminiService';
import { Slide } from '../../types';

const Presenter: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [slides, setSlides] = useState<Slide[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic) return;
        setIsLoading(true);
        setError('');
        setSlides([]);
        setCurrentSlide(0);

        try {
            const generatedSlides = await generateSlidesFromText(topic);
            setSlides(generatedSlides);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">Presentation Creator</h1>
            
            <Card>
                <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a topic or paste an essay to generate a presentation..."
                    rows={4}
                />
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleGenerate} isLoading={isLoading}>Generate Slides</Button>
                </div>
            </Card>

            {isLoading && <Card><Loader text="Creating presentation..." /></Card>}
            {error && <Card><p className="text-red-500">{error}</p></Card>}

            {slides.length > 0 && (
                <Card>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-inner min-h-[300px] sm:min-h-[400px] flex flex-col justify-center">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">{slides[currentSlide].title}</h2>
                        <ul className="list-disc list-inside space-y-2 text-md sm:text-lg">
                            {slides[currentSlide].content.map((point, index) => <li key={index}>{point}</li>)}
                        </ul>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <Button onClick={() => setCurrentSlide(s => Math.max(0, s - 1))} disabled={currentSlide === 0}>Previous</Button>
                        <span className="font-semibold">Slide {currentSlide + 1} of {slides.length}</span>
                        <Button onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))} disabled={currentSlide === slides.length - 1}>Next</Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Presenter;
