// src/components/Sidebar.jsx

import React, { useState } from 'react';
import { Settings, RefreshCw, Plus, Trash2, Info, CheckCircle, XCircle, ChevronLeft, Menu } from 'lucide-react';

const Sidebar = ({ 
  projektSifra, 
  daluxConnected,
  daluxProjectId,
  stats,
  onResetProject,
  onClearAll,
  onAddCustomOption,
  isCollapsed
}) => {
  const [showAddTip, setShowAddTip] = useState(false);
  const [showAddFaza, setShowAddFaza] = useState(false);
  const [showAddVlo, setShowAddVlo] = useState(false);

  const [tipCode, setTipCode] = useState('');
  const [tipDesc, setTipDesc] = useState('');
  const [fazaCode, setFazaCode] = useState('');
  const [fazaDesc, setFazaDesc] = useState('');
  const [vloCode, setVloCode] = useState('');
  const [vloDesc, setVloDesc] = useState('');

  const [message, setMessage] = useState('');

  const handleAddTip = () => {
    const result = onAddCustomOption('TIP', tipCode, tipDesc);
    setMessage(result.message);
    if (result.success) {
      setTipCode('');
      setTipDesc('');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAddFaza = () => {
    const result = onAddCustomOption('FAZA', fazaCode, fazaDesc);
    setMessage(result.message);
    if (result.success) {
      setFazaCode('');
      setFazaDesc('');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAddVlo = () => {
    const result = onAddCustomOption('VLO', vloCode, vloDesc);
    setMessage(result.message);
    if (result.success) {
      setVloCode('');
      setVloDesc('');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className={`${isCollapsed ? 'w-0' : 'w-80'} flex-shrink-0 transition-all duration-300 bg-white border-l border-slate-200 relative flex flex-col h-full`}>
  
      

      {/* Wrap EVERYTHING else inside this conditional and a scrollable container */}
      {!isCollapsed && (
        <div className="p-6 overflow-y-auto h-full">
      {/* Settings Header */}
      <div className="flex items-center gap-2 mb-6">  
        <Settings className="w-5 h-5 text-slate-700" />
        <h2 className="text-lg font-semibold text-slate-800">Nastavitve</h2>
      </div>

      {/* Project Info */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Šifra projekta:
        </label>
        <input
          type="text"
          value={projektSifra}
          disabled
          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600"
        />
        <p className="text-xs text-slate-500 mt-1">
          Šifra se uporabi kot prefix v vseh datotekah
        </p>
      </div>

      <button
        onClick={onResetProject}
        className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 mb-6"
      >
        <RefreshCw className="w-4 h-4" />
        Zamenjaj projekt
      </button>

      <div className="border-t border-slate-200 my-6"></div>

      {/* Dalux Status */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          Dalux status
        </h3>
        {daluxConnected && daluxProjectId ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Povezan z Dalux</span>
            </div>
            <p className="text-xs text-green-600">
              Projekt ID: {daluxProjectId}
            </p>
            <p className="text-xs text-green-600">
              Šifra: {projektSifra}
            </p>
          </div>
        ) : (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Info className="w-4 h-4" />
              <span className="text-sm">Dalux povezava je vzpostavljena</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 my-6"></div>

      

      {/* Add Custom Options */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Dodaj nove kode
        </h3>

        {/* Message */}
        {message && (
          <div className={`mb-3 p-2 rounded text-xs ${
            message.startsWith('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Add TIP */}
        <div className="mb-4">
          <button
            onClick={() => setShowAddTip(!showAddTip)}
            className="w-full text-left px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition"
          >
            + Dodaj TIP
          </button>
          {showAddTip && (
            <div className="mt-2 p-3 bg-slate-50 rounded-lg space-y-2">
              <input
                type="text"
                placeholder="Koda (3 črke)"
                value={tipCode}
                onChange={(e) => setTipCode(e.target.value)}
                maxLength={3}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Opis"
                value={tipDesc}
                onChange={(e) => setTipDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handleAddTip}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 rounded transition"
              >
                Dodaj
              </button>
            </div>
          )}
        </div>

        {/* Add FAZA */}
        <div className="mb-4">
          <button
            onClick={() => setShowAddFaza(!showAddFaza)}
            className="w-full text-left px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition"
          >
            + Dodaj FAZA
          </button>
          {showAddFaza && (
            <div className="mt-2 p-3 bg-slate-50 rounded-lg space-y-2">
              <input
                type="text"
                placeholder="Koda (3 črke)"
                value={fazaCode}
                onChange={(e) => setFazaCode(e.target.value)}
                maxLength={3}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Opis"
                value={fazaDesc}
                onChange={(e) => setFazaDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handleAddFaza}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 rounded transition"
              >
                Dodaj
              </button>
            </div>
          )}
        </div>

        {/* Add VLO */}
        <div className="mb-4">
          <button
            onClick={() => setShowAddVlo(!showAddVlo)}
            className="w-full text-left px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition"
          >
            + Dodaj VLO
          </button>
          {showAddVlo && (
            <div className="mt-2 p-3 bg-slate-50 rounded-lg space-y-2">
              <input
                type="text"
                placeholder="Koda (3 črke)"
                value={vloCode}
                onChange={(e) => setVloCode(e.target.value)}
                maxLength={3}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="Opis"
                value={vloDesc}
                onChange={(e) => setVloDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handleAddVlo}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 rounded transition"
              >
                Dodaj
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 my-6"></div>

      {/* Progress */}
      {stats.total > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Napredek</h3>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-600">
              {stats.complete}/{stats.total}
            </p>
            <p className="text-sm text-blue-700 mt-1">datotek pripravljenih</p>
          </div>

          <button
            onClick={onClearAll}
            className="w-full mt-4 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Počisti vse
          </button>
        </div>
      )}
    </div>
)} {/* This closes the !isCollapsed check */}
    </div>
  );
};
export default Sidebar;