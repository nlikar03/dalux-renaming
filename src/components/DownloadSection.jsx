// src/components/DownloadSection.jsx

import React, { useState } from 'react';
import { Download, Cloud, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { isFileComplete, generateNewFilename } from '../utils/fileHelpers';
import { MAPNA_STRUKTURA } from '../utils/constants';
import DaluxApiClient from '../api/daluxApi';
import JSZip from 'jszip';

const DownloadSection = ({ files, projektSifra, daluxApiKey, daluxConnected }) => {
  const [uploadMode, setUploadMode] = useState('zip');
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);

  const completeFiles = files.filter(f => isFileComplete(f));
  const incompleteFiles = files.filter(f => !isFileComplete(f));

  const createZip = async () => {
    const zip = new JSZip();

    // Create folder structure
    Object.entries(MAPNA_STRUKTURA).forEach(([main, subs]) => {
      zip.folder(main);
      subs.forEach(sub => {
        zip.folder(`${main}/${sub}`);
      });
    });

    // Add files
    completeFiles.forEach(file => {
      const newName = generateNewFilename(file, projektSifra);
      const path = `${file.target_subfolder}/${newName}`;
      zip.file(path, file.content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
  };

  const handleDownloadZip = async () => {
    const blob = await createZip();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projekt_${projektSifra}_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadToDalux = async () => {
    setUploading(true);
    setUploadResults(null);

    try {
      const client = new DaluxApiClient();
      
      // Organize files by folder
      const filesDict = {};
      completeFiles.forEach(file => {
        const folder = file.target_subfolder;
        const filename = generateNewFilename(file, projektSifra);
        
        if (!filesDict[folder]) {
          filesDict[folder] = [];
        }
        filesDict[folder].push([filename, file.content]);
      });

      const results = await client.bulkUploadFromStructure(projektSifra, filesDict);
      setUploadResults(results);
    } catch (error) {
      setUploadResults({
        success: 0,
        failed: completeFiles.length,
        details: [],
        error: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          3. Prenesi rezultat ali naloži v Dalux
        </h2>
        <div className="text-center py-8 text-slate-500">
          <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p>Najprej naloži datoteke</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <Download className="w-5 h-5" />
        3. Prenesi rezultat ali naloži v Dalux
      </h2>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600 mb-1">Skupaj datotek</p>
          <p className="text-2xl font-bold text-slate-800">{files.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-sm text-green-700 mb-1">Pripravljeno</p>
          <p className="text-2xl font-bold text-green-600">{completeFiles.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-700 mb-1">Manjka</p>
          <p className="text-2xl font-bold text-yellow-600">{incompleteFiles.length}</p>
        </div>
      </div>

      {/* All files ready */}
      {completeFiles.length === files.length && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-medium">
            🎉 Vse datoteke so pripravljene!
          </p>
        </div>
      )}

      {/* Some files incomplete */}
      {incompleteFiles.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-800 font-medium mb-2">
                ⚠️ {incompleteFiles.length} datotekam še manjkajo podatki
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-yellow-700 hover:text-yellow-900 font-medium">
                  Prikaži nepopolne datoteke
                </summary>
                <div className="mt-3 space-y-2">
                  {incompleteFiles.map((file, idx) => {
                    const missing = [];
                    if (!file.tip) missing.push('TIP');
                    if (!file.faza) missing.push('FAZA');
                    if (!file.vlo) missing.push('VLO');
                    if (!file.ime) missing.push('IME');
                    if (!file.target_subfolder) missing.push('Podmapa');

                    return (
                      <div key={idx} className="p-2 bg-white rounded border border-yellow-200">
                        <p className="font-medium text-yellow-900">{file.original_name}</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Manjka: {missing.join(', ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selection */}
      {completeFiles.length > 0 && (
        <>
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Izberi način:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setUploadMode('zip')}
                className={`p-4 rounded-lg border-2 transition ${
                  uploadMode === 'zip'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Package className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Prenesi ZIP</p>
              </button>
              <button
                onClick={() => setUploadMode('dalux')}
                className={`p-4 rounded-lg border-2 transition ${
                  uploadMode === 'dalux'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Cloud className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Naloži v Dalux</p>
              </button>
            </div>
          </div>

          {/* ZIP Download */}
          {uploadMode === 'zip' && (
            <div>
              <button
                onClick={handleDownloadZip}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5" />
                PRENESI ZIP ARHIV S PREIMENOVANIMI DATOTEKAMI
              </button>
              <p className="text-sm text-slate-600 mt-3 text-center">
                💡 ZIP vsebuje celotno mapno strukturo projekta z preimenovanimi datotekami
              </p>
            </div>
          )}

          {/* Dalux Upload */}
          {uploadMode === 'dalux' && (
            <div>
              {!daluxConnected ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-yellow-800">
                    ⚠️ Dalux povezava je že vzpostavljena preko projekta
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      📤 Naložil bom {completeFiles.length} datotek v Dalux projekt: <strong>{projektSifra}</strong>
                    </p>
                  </div>

                  <button
                    onClick={handleUploadToDalux}
                    disabled={uploading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-4 px-6 rounded-lg transition flex items-center justify-center gap-3"
                  >
                    <Cloud className="w-5 h-5" />
                    {uploading ? 'NALAGAM V DALUX...' : 'NALOŽI V DALUX'}
                  </button>

                  {/* Upload Results */}
                  {uploadResults && (
                    <div className="mt-4">
                      {uploadResults.error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 font-medium">❌ Napaka pri nalaganju:</p>
                          <p className="text-sm text-red-700 mt-1">{uploadResults.error}</p>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 font-medium">
                              ✅ Uspešno naloženih: {uploadResults.success}
                            </p>
                            {uploadResults.failed > 0 && (
                              <p className="text-red-700 mt-1">
                                ❌ Neuspešnih: {uploadResults.failed}
                              </p>
                            )}
                          </div>

                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-slate-700 hover:text-slate-900 font-medium">
                              📋 Podrobnosti nalaganja
                            </summary>
                            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                              {uploadResults.details.map((detail, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2 rounded text-sm ${
                                    detail.status === 'success'
                                      ? 'bg-green-50 text-green-800'
                                      : 'bg-red-50 text-red-800'
                                  }`}
                                >
                                  {detail.status === 'success' ? '✅' : '❌'} {detail.file} → {detail.folder}
                                  {detail.error && <span className="text-xs block mt-1">{detail.error}</span>}
                                </div>
                              ))}
                            </div>
                          </details>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DownloadSection;