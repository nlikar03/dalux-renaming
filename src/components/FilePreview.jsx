// src/components/FilePreview.jsx

import React from 'react';
import { Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { generateNewFilename, isFileComplete } from '../utils/fileHelpers';

const FilePreview = ({ file, projektSifra }) => {
  const newFilename = generateNewFilename(file, projektSifra);
  const complete = isFileComplete(file);
  const fullPath = file.target_subfolder && newFilename 
    ? `${file.target_subfolder}/${newFilename}`
    : '';

  if (!newFilename && !file.target_subfolder) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-2 text-slate-500">
          <Eye className="w-5 h-5" />
          <p className="text-sm">
            Predogled bo prikazan ko bodo izpolnjena vsa obvezna polja
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-lg border-2 ${
      complete 
        ? 'bg-green-50 border-green-300' 
        : 'bg-yellow-50 border-yellow-300'
    }`}>
      <div className="flex items-start gap-3 mb-4">
        {complete ? (
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className={`font-semibold mb-1 ${
            complete ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {complete ? '✅ Vsi podatki izpolnjeni!' : '⚠️ Manjkajo obvezna polja'}
          </h4>
          {!complete && (
            <p className="text-sm text-yellow-700">
              Izpolni vsa polja označena z * za nadaljevanje
            </p>
          )}
        </div>
      </div>

      {newFilename && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              📝 Novo ime datoteke:
            </p>
            <code className="block p-3 bg-white rounded border border-slate-300 text-sm font-mono text-slate-800 break-all">
              {newFilename}
            </code>
          </div>

          {file.target_subfolder && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                📁 Pot v ZIP arhivu:
              </p>
              <code className="block p-3 bg-white rounded border border-slate-300 text-sm font-mono text-slate-800 break-all">
                {fullPath}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilePreview;