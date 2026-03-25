// src/components/FileEditor.jsx

import React, { useState } from 'react';
import { Edit3, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { getAllFolderPaths } from '../utils/constants';
import FilePreview from './FilePreview';
import { analyzeFileWithAI } from '../services/aiService';

const FileEditor = ({ 
  file, 
  index, 
  total,
  tipOptions,
  fazaOptions,
  vloOptions,
  projektSifra,
  onUpdate,
  onNavigate
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  if (!file) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          2. Uredi podatke
        </h2>
        <div className="text-center py-12 text-slate-500">
          <Edit3 className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p>Izberi datoteko iz seznama za urejanje</p>
        </div>
      </div>
    );
  }

  const allPaths = getAllFolderPaths();

  const handleUpdate = (field, value) => {
    onUpdate(index, { [field]: value });
  };

  const getFieldStyle = (value) => {
    return !value || value === "" 
      ? "bg-rose-50 border-rose-200" 
      : "bg-white border-slate-300";
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiResult(null);

    try {
      const result = await analyzeFileWithAI(
        file.original_name,
        tipOptions,
        fazaOptions,
        vloOptions,
        allPaths
      );

      if (result.success) {
        setAiResult(result.data);
        
        // Auto-apply the suggestions
        onUpdate(index, {
          tip: result.data.tip,
          faza: result.data.faza,
          vlo: result.data.vlo,
          target_subfolder: result.data.target_subfolder
        });
      } else {
        alert(`AI Napaka: ${result.error}`);
      }
    } catch (error) {
      alert(`Napaka pri AI analizi: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          2. Uredi podatke
        </h2>

        {/* AI Button */}
        <button
          onClick={handleAIAnalysis}
          disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analiziram...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              AI Pomočnik
            </>
          )}
        </button>
      </div>

      {/* AI Result Info */}
      {aiResult && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900 mb-1">
                AI Predlog (zaupanje: {aiResult.confidence})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <button
          onClick={() => onNavigate(index - 1)}
          disabled={index === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Prejšnja
        </button>

        <div className="text-center">
          <p className="text-sm text-slate-600">Datoteka</p>
          <p className="font-semibold text-slate-800">
            {index + 1} / {total}
          </p>
        </div>

        <button
          onClick={() => onNavigate(index + 1)}
          disabled={index >= total - 1}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition"
        >
          Naslednja
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Current File Info */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Originalno ime:</strong> {file.original_name}
        </p>
      </div>

      {/* TIP, FAZA, VLO side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* TIP */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            TIP dokumenta: <span className="text-red-500">*</span>
          </label>
          <select
            value={file.tip}
            onChange={(e) => handleUpdate('tip', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${getFieldStyle(file.tip)}`}
          >
            <option value="">⚠️ Izberi TIP...</option>
            {Object.entries(tipOptions).map(([code, desc]) => (
              <option key={code} value={code}>
                {code} - {desc}
              </option>
            ))}
          </select>
        </div>

        {/* FAZA */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            FAZA projekta: <span className="text-red-500">*</span>
          </label>
          <select
            value={file.faza}
            onChange={(e) => handleUpdate('faza', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${getFieldStyle(file.faza)}`}
          >
            <option value="">⚠️ Izberi FAZO...</option>
            {Object.entries(fazaOptions).map(([code, desc]) => (
              <option key={code} value={code}>
                {code} - {desc}
              </option>
            ))}
          </select>
        </div>

        {/* VLO */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            VLO (Vloga): <span className="text-red-500">*</span>
          </label>
          <select
            value={file.vlo}
            onChange={(e) => handleUpdate('vlo', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${getFieldStyle(file.vlo)}`}
          >
            <option value="">⚠️ Izberi VLO...</option>
            {Object.entries(vloOptions).map(([code, desc]) => (
              <option key={code} value={code}>
                {code} - {desc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* IME */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          IME dokumenta: <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={file.ime}
          onChange={(e) => handleUpdate('ime', e.target.value.replace(/\s+/g, '_').substring(0, 100))}
          maxLength={100}
          placeholder="Vnesi ime dokumenta"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
        <p className="text-xs text-slate-500 mt-1">
          Znakov: {file.ime.length}/100 (presledki se zamenjajo z _)
        </p>
      </div>

      {/* DATUM */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          DATUM (opcijsko):
        </label>
        <input
          type="date"
          value={file.datum}
          onChange={(e) => handleUpdate('datum', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
      </div>

      {/* Target Subfolder */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Ciljna podmapa: <span className="text-red-500">*</span>
        </label>
        <select
          value={file.target_subfolder}
          onChange={(e) => handleUpdate('target_subfolder', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${getFieldStyle(file.target_subfolder)}`}
        >
          <option value="">Izberi mapo...</option>
          {allPaths.map(path => (
            <option key={path} value={path}>
              {path}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          Izberi mapo iz strukture projekta
        </p>
      </div>

      {/* Preview */}
      <div className="mt-6">
        <FilePreview file={file} projektSifra={projektSifra} />
      </div>
    </div>
  );
};

export default FileEditor;