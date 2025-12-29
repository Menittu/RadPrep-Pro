
import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Loader2, CheckCircle2, AlertCircle, Save, Wand2, Key, ExternalLink } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { db } from '../db';

interface AIGeneratorViewProps {
  onImport: () => void;
}

const AIGeneratorView: React.FC<AIGeneratorViewProps> = ({ onImport }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const generateQuestions = async () => {
    if (!topic.trim()) {
      setError('Please enter a research topic.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    setGeneratedQuestions([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate ${count} professional radiotherapy recruitment exam multiple-choice questions for the chapter: "${topic}". 
      Ensure questions follow medical standards (ICRP, ICRU, IAEA). 
      Include exactly 4 options for each question. 
      The explanation should be conceptual and concise.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a senior clinical oncologist and radiotherapy examiner. You provide high-yield, technically accurate MCQs for professional RTT and Medical Physics exams.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The MCQ question text." },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "List of exactly 4 options."
                },
                correctIndex: { type: Type.INTEGER, description: "Zero-based index of the correct option (0-3)." },
                explanation: { type: Type.STRING, description: "Brief conceptual explanation." }
              },
              required: ["text", "options", "correctIndex", "explanation"]
            }
          }
        },
      });

      const rawText = response.text || '';
      // Sanitize response: sometimes AI wraps JSON in markdown blocks even if mimeType is set
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : rawText;
      
      const data = JSON.parse(jsonString.trim() || '[]');
      if (!Array.isArray(data)) throw new Error("Invalid response format");
      setGeneratedQuestions(data);
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      const errorMessage = err.message || '';
      if (errorMessage.includes("Requested entity was not found")) {
        setError('API configuration issue. Please re-select your API key project.');
        setHasKey(false);
      } else {
        setError(`Connection Error: ${errorMessage.slice(0, 100) || 'Failed to reach AI service'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const importToDatabase = async () => {
    if (generatedQuestions.length === 0) return;
    
    try {
      setLoading(true);
      await db.addQuestions(topic, generatedQuestions);
      setSuccess(true);
      setGeneratedQuestions([]);
      setTopic('');
      onImport();
    } catch (err) {
      setError('Import failed. Database error.');
    } finally {
      setLoading(false);
    }
  };

  if (hasKey === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-fadeIn text-center max-w-lg mx-auto px-4">
        <div className="w-24 h-24 bg-[#9CF1F3] dark:bg-[#3F4948] rounded-[32px] flex items-center justify-center text-[#00696B] dark:text-[#80D4D6] shadow-2xl">
          <Key size={48} />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight">AI Connection Required</h1>
          <p className="text-[#3F4948] dark:text-[#BEC8C8] font-medium leading-relaxed">
            To use the AI Research Lab with Gemini 3 Pro, you must select a valid API key from a paid Google Cloud project.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-left">
            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Ensure your project has billing enabled. Visit the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold inline-flex items-center gap-1">billing docs <ExternalLink size={10}/></a> for details.
            </p>
          </div>
        </div>
        <button 
          onClick={handleOpenKeySelector}
          className="w-full bg-[#00696B] hover:bg-[#005254] text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-[#00696B]/30 flex items-center justify-center gap-3 text-lg"
        >
          Connect to Google AI Studio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12 max-w-3xl mx-auto">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-[#9CF1F3] dark:bg-[#3F4948] rounded-3xl flex items-center justify-center text-[#00696B] dark:text-[#80D4D6] shadow-lg shadow-[#00696B]/10">
          <Sparkles size={32} />
        </div>
        <h1 className="text-3xl font-black tracking-tight">AI Research Lab</h1>
        <p className="text-[#3F4948] dark:text-[#BEC8C8] font-medium max-w-md mx-auto">
          Harness neural networks to generate custom radiotherapy MCQs tailored to your curriculum.
        </p>
      </div>

      <div className="bg-white dark:bg-[#191C1C] p-8 rounded-[40px] border border-[#DAE4E4] dark:border-[#3F4948] shadow-xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-[#00696B] dark:text-[#80D4D6] ml-2">Topic / Chapter Name</label>
            <input 
              type="text" 
              placeholder="e.g. Brachytherapy Physics, SRS/SBRT Basics..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-[#F4FBFA] dark:bg-[#0E1414] border-2 border-transparent focus:border-[#00696B] outline-none transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[#00696B] dark:text-[#80D4D6] ml-2">Question Count</label>
              <select 
                value={count} 
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-6 py-4 rounded-2xl bg-[#F4FBFA] dark:bg-[#0E1414] border-2 border-transparent focus:border-[#00696B] outline-none transition-all font-medium appearance-none"
              >
                {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} Questions</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={generateQuestions}
                disabled={loading}
                className="w-full bg-[#00696B] hover:bg-[#005254] text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-[#00696B]/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-medium animate-fadeIn">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="p-8 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-dashed border-emerald-500/30 rounded-[32px] text-center space-y-4 animate-fadeIn">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
          <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Import Successful!</h3>
          <p className="text-sm text-[#3F4948] dark:text-[#BEC8C8]">Your generated chapter is now available in the Chapter Vault.</p>
          <button onClick={() => setSuccess(false)} className="px-8 py-2 bg-emerald-500 text-white rounded-full text-sm font-bold">Dismiss</button>
        </div>
      )}

      {generatedQuestions.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold">Review Generation</h3>
            <button 
              onClick={importToDatabase}
              className="flex items-center gap-2 px-6 py-2 bg-[#9CF1F3] text-[#00696B] rounded-full font-bold hover:scale-105 transition-all"
            >
              <Save size={18} /> Import All
            </button>
          </div>
          
          <div className="space-y-4">
            {generatedQuestions.map((q, i) => (
              <div key={i} className="bg-white dark:bg-[#191C1C] p-6 rounded-[28px] border border-[#DAE4E4] dark:border-[#3F4948] shadow-sm">
                <p className="text-lg font-bold mb-4 leading-snug">{q.text}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {q.options.map((opt: string, idx: number) => (
                    <div key={idx} className={`p-3 rounded-xl border text-sm ${idx === q.correctIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                      {String.fromCharCode(65 + idx)}. {opt}
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#0E1414] rounded-2xl text-xs text-[#3F4948] dark:text-[#BEC8C8] italic">
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && !generatedQuestions.length && (
        <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center">
          <div className="relative">
             <div className="w-24 h-24 border-4 border-[#00696B]/10 border-t-[#00696B] rounded-full animate-spin"></div>
             <Brain size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00696B] animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-[#00696B]">Synthesizing Concepts...</p>
            <p className="text-sm text-gray-400">Gemini is drafting technical radiotherapy MCQs</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGeneratorView;
