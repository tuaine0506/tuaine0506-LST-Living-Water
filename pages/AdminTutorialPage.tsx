import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PlayCircle, RefreshCw, Video, Info, Key, Download, CheckCircle, ShieldCheck, ClipboardList, BarChart3, CalendarDays, BookOpen, ChevronRight } from 'lucide-react';

const AdminTutorialPage: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'sales' | 'groups'>('orders');

  const generateTutorial = async () => {
    setError(null);
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }

    setIsGenerating(true);
    setStatus('Planning tutorial scenes...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'A step-by-step instructional animation for the Living Water Admin dashboard. Scene 1: An order list showing "Mark as Fulfilled" buttons being clicked. Scene 2: Colorful charts and sales stats appearing. Scene 3: A cookbook interface showing cold-pressed juice recipes. Scene 4: A calendar showing upcoming Sunday fulfillment groups. High quality, professional UI animation, forest green and orange theme.',
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        setStatus('Synthesizing Admin Training Video (approx. 1-2 mins)...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      } else {
        throw new Error("Video generation failed.");
      }
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        await (window as any).aistudio.openSelectKey();
        setError("API Key error. Please re-select your key.");
      } else {
        setError(err.message || "Failed to generate video.");
      }
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  const guides = {
    orders: {
      title: 'Managing Orders',
      icon: <ClipboardList size={24} />,
      steps: [
        'Navigate to the "Fulfill" tab in the bottom navigation.',
        'Review pending orders. Check the Zelle confirmation number against your bank records.',
        'Click "Mark as Fulfilled" once payment is verified and the shot is prepared.',
        'Use the "Notify Customer" button to send a pre-filled SMS or Email with pickup/delivery details.',
        'Orders marked as fulfilled will move to the bottom of the list.'
      ]
    },
    sales: {
      title: 'Tracking Sales',
      icon: <BarChart3 size={24} />,
      steps: [
        'Go to the "Stats" tab to view real-time fundraising progress.',
        'Monitor "Total Revenue", "Total Orders", and "Average Order Value".',
        'Check the "Sales by Group" chart to see which volunteer group is leading.',
        'Use these stats for weekly Fellowship announcements and motivation.'
      ]
    },
    groups: {
      title: 'Volunteer Groups',
      icon: <CalendarDays size={24} />,
      steps: [
        'Visit the "Dates" tab to see the upcoming 8-week schedule.',
        'Each Sunday is assigned to a specific group (e.g., Group A, Group B).',
        'Ensure the assigned group is aware of their upcoming fulfillment duty.',
        'The "Recipes" tab provides standardized instructions for all groups to maintain quality.'
      ]
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-bold mb-4 border border-brand-green/20">
          <ShieldCheck size={14} /> Administrator Only
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif">Admin Training Center</h1>
        <p className="text-brand-brown mt-2">Comprehensive guide to managing the Living Water fundraiser.</p>
      </div>

      {/* Interactive Guide Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-brand-light-green/20 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(Object.keys(guides) as Array<keyof typeof guides>).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-4 px-2 text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === key 
                  ? 'text-brand-green bg-brand-green/5 border-b-2 border-brand-green' 
                  : 'text-gray-400 hover:text-brand-brown hover:bg-gray-50'
              }`}
            >
              {guides[key].icon}
              <span className="hidden sm:inline">{guides[key].title}</span>
            </button>
          ))}
        </div>
        
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange">
              {guides[activeTab].icon}
            </div>
            <h2 className="text-2xl font-bold text-brand-green font-serif">{guides[activeTab].title}</h2>
          </div>
          
          <div className="space-y-4">
            {guides[activeTab].steps.map((step, index) => (
              <div key={index} className="flex gap-4 items-start p-4 rounded-2xl bg-brand-cream/10 border border-brand-cream/20 hover:border-brand-orange/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-brand-green text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  {index + 1}
                </div>
                <p className="text-brand-brown text-sm md:text-base leading-relaxed pt-1">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-brand-light-green/20 space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-brand-orange/10 rounded-xl text-brand-orange">
                <BookOpen size={24} />
             </div>
             <h2 className="text-xl font-bold text-brand-green font-serif">Quick Tips</h2>
          </div>
          <ul className="space-y-3">
            {[
              { title: 'Zelle Verification', desc: 'Always verify the confirmation number before fulfillment.' },
              { title: 'Customer Contact', desc: 'Use the notify tool to save time on manual messaging.' },
              { title: 'Recipe Adherence', desc: 'Consistency is key for our brand and fundraiser success.' }
            ].map(item => (
              <li key={item.title} className="flex gap-3">
                <CheckCircle size={18} className="text-brand-light-green shrink-0 mt-0.5" />
                <div>
                   <p className="text-sm font-bold text-brand-brown">{item.title}</p>
                   <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-brand-green text-white p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-center border border-white/10">
          <div className="flex items-start gap-3">
             <Key className="text-brand-orange shrink-0 mt-1" size={20} />
             <div className="space-y-1">
                <p className="font-bold">AI Video Tutorial</p>
                <p className="text-xs text-brand-cream/80 leading-relaxed">
                  Generate a unique AI training video that visualizes the dashboard features.
                </p>
             </div>
          </div>
          
          <button
            onClick={generateTutorial}
            disabled={isGenerating}
            className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
              isGenerating ? 'bg-gray-500 cursor-not-allowed' : 'bg-brand-orange hover:bg-opacity-90'
            }`}
          >
            {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Video size={20} />}
            {isGenerating ? 'Generating Video...' : 'Generate Video Tutorial'}
          </button>
          
          {status && <p className="text-[10px] text-center font-bold text-brand-light-green animate-pulse">{status}</p>}
        </div>
      </div>

      {videoUrl && (
        <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-brand-green space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-bold text-brand-green flex items-center gap-2">
               <PlayCircle className="text-brand-orange" /> Generated Admin Tutorial
            </h3>
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = videoUrl;
                link.download = 'admin-training.mp4';
                link.click();
              }}
              className="text-[10px] font-bold bg-brand-cream/30 text-brand-brown px-3 py-1.5 rounded-lg border hover:bg-brand-cream transition-colors flex items-center gap-2"
            >
              <Download size={14} /> Download MP4
            </button>
          </div>
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
            <video src={videoUrl} controls className="w-full h-full" />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
          <Info size={20} /> {error}
        </div>
      )}
    </div>
  );
};

export default AdminTutorialPage;