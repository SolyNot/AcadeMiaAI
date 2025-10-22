
import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Task, StudyPlan } from '../../types';
import { generateStudyPlan } from '../../services/geminiService';
import Loader from '../../components/ui/Loader';

type PlannerMode = 'tasks' | 'studyPlan';

const Planner: React.FC = () => {
    const [mode, setMode] = useState<PlannerMode>('tasks');
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, title: 'Complete Chapter 5 Math exercises', dueDate: '2024-09-15', completed: false },
        { id: 2, title: 'Draft History essay on Roman Empire', dueDate: '2024-09-18', completed: false },
        { id: 3, title: 'Study for Chemistry midterm', dueDate: '2024-09-22', completed: true },
    ]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');

    const [planTopic, setPlanTopic] = useState('');
    const [planDuration, setPlanDuration] = useState(7);
    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');


    const handleAddTask = () => {
        if (!newTaskTitle || !newTaskDate) return;
        const newTask: Task = {
            id: Date.now(),
            title: newTaskTitle,
            dueDate: newTaskDate,
            completed: false,
        };
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
        setNewTaskDate('');
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
    };

    const handleGeneratePlan = async () => {
        if (!planTopic || planDuration <= 0) return;
        setIsLoading(true);
        setError('');
        setStudyPlan(null);
        try {
            const plan = await generateStudyPlan(planTopic, planDuration);
            setStudyPlan(plan);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">Task & Schedule Planner</h1>

            <Card>
                <div className="flex space-x-2 mb-4">
                    <Button variant={mode === 'tasks' ? 'primary' : 'secondary'} onClick={() => setMode('tasks')}>Task Planner</Button>
                    <Button variant={mode === 'studyPlan' ? 'primary' : 'secondary'} onClick={() => setMode('studyPlan')}>Study Plan AI</Button>
                </div>

                {mode === 'tasks' && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">Add New Task</h2>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Task title..."
                                className="flex-grow p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                            />
                            <input
                                type="date"
                                value={newTaskDate}
                                onChange={(e) => setNewTaskDate(e.target.value)}
                                className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                            />
                            <Button onClick={handleAddTask}>Add Task</Button>
                        </div>
                    </>
                )}

                {mode === 'studyPlan' && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">Generate AI Study Plan</h2>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                value={planTopic}
                                onChange={(e) => setPlanTopic(e.target.value)}
                                placeholder="Study topic, e.g., 'World War II'"
                                className="flex-grow p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                            />
                            <input
                                type="number"
                                value={planDuration}
                                onChange={(e) => setPlanDuration(parseInt(e.target.value))}
                                min="1"
                                max="30"
                                className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 w-32"
                            />
                            <Button onClick={handleGeneratePlan} isLoading={isLoading}>Generate Plan</Button>
                        </div>
                    </>
                )}
            </Card>

            {mode === 'tasks' && (
                <Card>
                    <h2 className="text-2xl font-semibold mb-4">Your Tasks</h2>
                    <div className="space-y-4">
                        {tasks.map(task => (
                            <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg ${task.completed ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                <div className="flex items-center">
                                    <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="h-5 w-5 rounded mr-4" />
                                    <div>
                                        <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Due: {task.dueDate}</p>
                                    </div>
                                </div>
                                <Button variant="secondary" onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}>Delete</Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {isLoading && <Card><Loader text="Building your study plan..." /></Card>}
            {error && <Card><p className="text-red-500">{error}</p></Card>}
            
            {studyPlan && (
                <Card>
                    <h2 className="text-2xl font-semibold mb-4">Your {studyPlan.durationDays}-Day Plan for "{studyPlan.topic}"</h2>
                    <div className="space-y-4">
                        {studyPlan.dailyTasks.map(day => (
                            <div key={day.day} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-700">
                                <h3 className="text-xl font-bold text-indigo-500">Day {day.day}</h3>
                                <div className="mt-2">
                                    <h4 className="font-semibold">Topics:</h4>
                                    <ul className="list-disc list-inside ml-4 text-gray-600 dark:text-gray-400">
                                        {day.topics.map((t, i) => <li key={i}>{t}</li>)}
                                    </ul>
                                </div>
                                <div className="mt-2">
                                    <h4 className="font-semibold">Goals:</h4>
                                     <ul className="list-disc list-inside ml-4 text-gray-600 dark:text-gray-400">
                                        {day.goals.map((g, i) => <li key={i}>{g}</li>)}
                                    </ul>
                                </div>
                                <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/50 rounded-md">
                                    <h4 className="font-semibold">Daily Quiz:</h4>
                                    <p className="text-gray-700 dark:text-gray-300">{day.quiz.question}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400"><strong>Answer:</strong> {day.quiz.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

        </div>
    );
};

export default Planner;
