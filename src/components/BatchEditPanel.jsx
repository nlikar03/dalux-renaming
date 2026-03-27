// src/components/BatchEditPanel.jsx
// Shown when 1+ files are selected in FileList — applies metadata to all selected files at once.

import { useState } from 'react';
import { Layers, X, Check } from 'lucide-react';
import { getAllFolderPaths } from '../utils/constants';

const BatchEditPanel = ({ selectedCount, tipOptions, fazaOptions, vloOptions, onApply, onClear }) => {
  const [tip, setTip]   = useState('');
  const [faza, setFaza] = useState('');
  const [vlo, setVlo]   = useState('');
  const [subfolder, setSubfolder] = useState('');

  const folderPaths = getAllFolderPaths();

  const handleApply = () => {
    const updates = {};
    if (tip)       updates.tip = tip;
    if (faza)      updates.faza = faza;
    if (vlo)       updates.vlo = vlo;
    if (subfolder) updates.target_subfolder = subfolder;
    if (Object.keys(updates).length === 0) return;
    onApply(updates);
    // Reset fields after apply
    setTip(''); setFaza(''); setVlo(''); setSubfolder('');
  };

  const selectClass = 'w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white';

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2 text-sm">
          <Layers className="w-4 h-4" />
          Skupinsko urejanje — {selectedCount} {selectedCount === 1 ? 'datoteka' : 'datotek'}
        </h3>
        <button onClick={onClear} className="text-slate-400 hover:text-slate-600 transition" title="Počisti izbor">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-blue-600 mb-3">
        Nastavi samo polja, ki jih želiš spremeniti — prazna polja se ne bodo prepisala.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">TIP</label>
          <select value={tip} onChange={e => setTip(e.target.value)} className={selectClass}>
            <option value="">— ne spremeni —</option>
            {Object.entries(tipOptions).map(([k, v]) => (
              <option key={k} value={k}>{k} – {v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">FAZA</label>
          <select value={faza} onChange={e => setFaza(e.target.value)} className={selectClass}>
            <option value="">— ne spremeni —</option>
            {Object.entries(fazaOptions).map(([k, v]) => (
              <option key={k} value={k}>{k} – {v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">VLO</label>
          <select value={vlo} onChange={e => setVlo(e.target.value)} className={selectClass}>
            <option value="">— ne spremeni —</option>
            {Object.entries(vloOptions).map(([k, v]) => (
              <option key={k} value={k}>{k} – {v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Podmapa</label>
          <select value={subfolder} onChange={e => setSubfolder(e.target.value)} className={selectClass}>
            <option value="">— ne spremeni —</option>
            {folderPaths.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Check className="w-4 h-4" />
          Uporabi na {selectedCount} datotekah
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 text-sm rounded-lg border border-slate-300 transition"
        >
          Počisti izbor
        </button>
      </div>
    </div>
  );
};

export default BatchEditPanel;
