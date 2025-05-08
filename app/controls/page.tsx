'use client';

import { useState, useEffect } from 'react';
import { Pattern, defaultPatterns, AnimationParams } from '../lib/patterns';
import { useRouter } from 'next/navigation';

export default function ControlsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>(defaultPatterns);
  const [currentPattern, setCurrentPattern] = useState(0);
  const [patternParams, setPatternParams] = useState<AnimationParams>(defaultPatterns[0].animation);
  const router = useRouter();

  useEffect(() => {
    // Load saved patterns from localStorage if they exist
    const savedPatterns = localStorage.getItem('animationPatterns');
    if (savedPatterns) {
      setPatterns(JSON.parse(savedPatterns));
    }
  }, []);

  const updatePatternParams = (param: keyof AnimationParams, value: number | number[] | string) => {
    setPatternParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const saveCurrentPattern = () => {
    const newPatterns = [...patterns];
    newPatterns[currentPattern] = {
      ...newPatterns[currentPattern],
      animation: patternParams
    };
    setPatterns(newPatterns);
    localStorage.setItem('animationPatterns', JSON.stringify(newPatterns));
  };

  const resetPatterns = () => {
    setPatterns(defaultPatterns);
    setPatternParams(defaultPatterns[0].animation);
    localStorage.removeItem('animationPatterns');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-2xl font-light text-black">Animation Controls</h1>
            <p className="text-sm text-gray-500 mt-1">Customize your patterns</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm text-black hover:text-gray-600 transition-colors"
            >
              View
            </button>
            <button
              onClick={resetPatterns}
              className="px-4 py-2 text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="border-b border-gray-100 pb-6">
            <select 
              value={currentPattern}
              onChange={(e) => {
                const index = Number(e.target.value);
                setCurrentPattern(index);
                setPatternParams(patterns[index].animation);
              }}
              className="w-full text-lg font-light text-black border-none focus:ring-0 p-0"
            >
              {patterns.map((pattern, index) => (
                <option key={index} value={index}>
                  {pattern.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              {patterns[currentPattern].description}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-500">Duration</label>
                <span className="text-sm text-gray-500">{patternParams.duration}s</span>
              </div>
              <input 
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={patternParams.duration}
                onChange={(e) => updatePatternParams('duration', Number(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-500">Delay</label>
                <span className="text-sm text-gray-500">{patternParams.delay}s</span>
              </div>
              <input 
                type="range"
                min="0.001"
                max="0.01"
                step="0.001"
                value={patternParams.delay}
                onChange={(e) => updatePatternParams('delay', Number(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-4">Opacity</label>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Min</span>
                    <span className="text-xs text-gray-400">{patternParams.opacity[0]}</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={patternParams.opacity[0]}
                    onChange={(e) => updatePatternParams('opacity', [
                      Number(e.target.value),
                      patternParams.opacity[1]
                    ])}
                    className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Max</span>
                    <span className="text-xs text-gray-400">{patternParams.opacity[1]}</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={patternParams.opacity[1]}
                    onChange={(e) => updatePatternParams('opacity', [
                      patternParams.opacity[0],
                      Number(e.target.value)
                    ])}
                    className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
                  />
                </div>
              </div>
            </div>

            {patternParams.scale && (
              <div>
                <label className="text-sm text-gray-500 block mb-4">Scale</label>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">Min</span>
                      <span className="text-xs text-gray-400">{patternParams.scale[0]}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={patternParams.scale[0]}
                      onChange={(e) => updatePatternParams('scale', [
                        Number(e.target.value),
                        patternParams.scale![1]
                      ])}
                      className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">Max</span>
                      <span className="text-xs text-gray-400">{patternParams.scale[1]}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={patternParams.scale[1]}
                      onChange={(e) => updatePatternParams('scale', [
                        patternParams.scale![0],
                        Number(e.target.value)
                      ])}
                      className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {patternParams.rotate && (
              <div>
                <label className="text-sm text-gray-500 block mb-4">Rotation</label>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">Min</span>
                      <span className="text-xs text-gray-400">{patternParams.rotate[0]}°</span>
                    </div>
                    <input 
                      type="range"
                      min="-360"
                      max="360"
                      step="1"
                      value={patternParams.rotate[0]}
                      onChange={(e) => updatePatternParams('rotate', [
                        Number(e.target.value),
                        patternParams.rotate![1]
                      ])}
                      className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">Max</span>
                      <span className="text-xs text-gray-400">{patternParams.rotate[1]}°</span>
                    </div>
                    <input 
                      type="range"
                      min="-360"
                      max="360"
                      step="1"
                      value={patternParams.rotate[1]}
                      onChange={(e) => updatePatternParams('rotate', [
                        patternParams.rotate![0],
                        Number(e.target.value)
                      ])}
                      className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-500 block mb-2">Easing</label>
              <select 
                value={patternParams.ease || "sine.inOut"}
                onChange={(e) => updatePatternParams('ease', e.target.value)}
                className="w-full text-sm text-black border-none focus:ring-0 p-0"
              >
                <option value="sine.inOut">Sine In/Out</option>
                <option value="sine.in">Sine In</option>
                <option value="sine.out">Sine Out</option>
                <option value="power1.inOut">Power1 In/Out</option>
                <option value="power1.in">Power1 In</option>
                <option value="power1.out">Power1 Out</option>
                <option value="power2.inOut">Power2 In/Out</option>
                <option value="power2.in">Power2 In</option>
                <option value="power2.out">Power2 Out</option>
                <option value="bounce.out">Bounce Out</option>
                <option value="elastic.inOut">Elastic In/Out</option>
              </select>
            </div>
          </div>

          <button
            onClick={saveCurrentPattern}
            className="w-full py-3 text-sm text-black border border-black hover:bg-black hover:text-white transition-colors"
          >
            Save Pattern
          </button>
        </div>
      </div>
    </div>
  );
} 