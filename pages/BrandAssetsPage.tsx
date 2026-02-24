import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
// Fixed: Added missing 'X' icon to lucide-react imports
import { Download, RefreshCw, Palette, Image as ImageIcon, CheckCircle, Droplets, Video, Play, ExternalLink, Key, X } from 'lucide-react';

// Fixed: Removed the manual Window interface extension to avoid conflict with the environment's pre-defined AIStudio type.

const BrandAssetsPage: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const generateLogo = async () => {
    setIsGeneratingLogo(true);
    setError(null);
    try {
      // Correct initialization using named parameter as per guidelines.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'A professional, minimalist PNG logo for a mobile app called "Living Water". The logo MUST feature exactly two clean, stylized water drops. One drop slightly overlapping or next to the other. High-quality, modern, flat design. Brand colors: forest green and soft terracotta orange. The text "Living Water" should be written underneath in a clean, sans-serif, elegant font. Transparent or white background.',
            },
          ],
        },
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            setLogoUrl(`data:image/png;base64,${base64EncodeString}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) throw new Error("No image was generated.");
    } catch (err: any) {
      setError(err.message || "Failed to generate logo.");
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const generateTutorialVideo = async () => {
    setError(null);
    // Fixed: Use casting to any for window.aistudio to avoid type conflicts.
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
      // Proceed after assuming key selection successful per guidelines.
    }

    setIsGeneratingVideo(true);
    setVideoStatus('Initializing Veo...');

    try {
      // Fixed: Initialize GoogleGenAI instance right before the API call.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'A clean, modern animation for a wellness brand called Living Water. Shows a healthy person smiling, followed by a beautiful cold-pressed juice bottle with 2 water drops on it. Then shows a 3D animation of a phone screen with a Zelle logo and a confirmation checkmark. Soft, professional lighting, forest green and orange accents.',
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        setVideoStatus('Processing your custom tutorial video (this takes 1-2 mins)...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      } else {
        throw new Error("Video generation failed to return a link.");
      }
    } catch (err: any) {
      // Fixed: Reset key selection if the request fails with "Requested entity was not found".
      if (err.message?.includes("Requested entity was not found")) {
        await (window as any).aistudio.openSelectKey();
        setError("API Key error. Please re-select your key.");
      } else {
        setError(err.message || "Failed to generate video.");
      }
    } finally {
      setIsGeneratingVideo(false);
      setVideoStatus('');
    }
  };

  const downloadAsset = (url: string | null, name: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12 pb-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif text-shadow-sm">Brand Assets</h1>
        <p className="text-brand-brown mt-2 max-w-2xl mx-auto font-medium">
          Professional marketing tools for your church fellowship's fundraiser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* LOGO SECTION */}
        <div className="bg-white rounded-3xl shadow-xl border border-brand-light-green/20 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-orange/10 rounded-2xl">
                <Palette className="text-brand-orange" size={24} />
              </div>
              <h2 className="text-xl font-bold text-brand-green font-serif">Official Logo</h2>
            </div>
            
            <p className="text-sm text-brand-brown/70 leading-relaxed">
              Generate a high-resolution logo for your mobile app, flyers, or social media profiles.
            </p>

            <button
              onClick={generateLogo}
              disabled={isGeneratingLogo}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isGeneratingLogo ? 'bg-gray-400' : 'bg-brand-green hover:bg-opacity-90'
              }`}
            >
              {isGeneratingLogo ? <RefreshCw className="animate-spin" size={20} /> : <ImageIcon size={20} />}
              {isGeneratingLogo ? 'Generating Logo...' : 'Generate High-Res Logo'}
            </button>

            {logoUrl && (
              <div className="space-y-4 pt-4 border-t">
                <div className="aspect-square bg-brand-cream/10 rounded-2xl border flex items-center justify-center p-8">
                  <img src={logoUrl} alt="Logo" className="max-h-full object-contain drop-shadow-lg" />
                </div>
                <button
                  onClick={() => downloadAsset(logoUrl, 'living-water-logo.png')}
                  className="w-full bg-brand-orange text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download PNG
                </button>
              </div>
            )}
          </div>
        </div>

        {/* VIDEO TUTORIAL SECTION */}
        <div className="bg-white rounded-3xl shadow-xl border border-brand-light-green/20 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-orange/10 rounded-2xl">
                <Video className="text-brand-orange" size={24} />
              </div>
              <h2 className="text-xl font-bold text-brand-green font-serif">Tutorial Generator</h2>
            </div>
            
            <p className="text-sm text-brand-brown/70 leading-relaxed">
              Create a custom AI promotional video that explains how to order and pay via Zelle using **Veo 3.1**.
            </p>

            <div className="bg-brand-orange/5 p-4 rounded-2xl border border-brand-orange/20 flex items-start gap-3">
              <Key className="text-brand-orange flex-shrink-0 mt-0.5" size={16} />
              <div className="text-[11px] text-brand-brown/80 space-y-1">
                <p className="font-bold">Requires Paid API Key</p>
                <p>Generating video requires selecting a paid GCP project. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-brand-green underline font-bold">Learn more</a></p>
              </div>
            </div>

            <button
              onClick={generateTutorialVideo}
              disabled={isGeneratingVideo}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isGeneratingVideo ? 'bg-gray-400' : 'bg-brand-orange hover:bg-opacity-90'
              }`}
            >
              {isGeneratingVideo ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
              {isGeneratingVideo ? 'Creating Video...' : 'Generate AI Promo Video'}
            </button>

            {videoStatus && (
              <p className="text-center text-[11px] text-brand-brown font-bold animate-pulse">{videoStatus}</p>
            )}

            {videoUrl && (
              <div className="space-y-4 pt-4 border-t">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                  <video src={videoUrl} controls className="w-full h-full" />
                </div>
                <button
                  onClick={() => downloadAsset(videoUrl, 'living-water-promo.mp4')}
                  className="w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download MP4
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
          {/* Fixed: X is now imported correctly */}
          <X size={20} />
          {error}
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-brand-green p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border border-white/10">
          <div className="flex items-center gap-5">
              <div className="p-4 bg-white/10 rounded-2xl shadow-inner">
                  <Droplets className="text-brand-orange" size={32} />
              </div>
              <div>
                  <h4 className="font-bold text-xl font-serif">Spread the Word</h4>
                  <p className="text-sm text-brand-light-green">Use these assets on Instagram and Facebook to boost sales.</p>
              </div>
          </div>
          <button 
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            className="text-xs bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-all border border-white/10"
          >
            Back to Top
          </button>
      </div>
    </div>
  );
};

export default BrandAssetsPage;
