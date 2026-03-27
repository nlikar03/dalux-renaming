// src/components/DownloadSection.jsx

import { useState } from 'react';
import { Download, Cloud, Package, AlertCircle, CheckCircle, Loader2, Clock, RefreshCw, XCircle } from 'lucide-react';
import { isFileComplete, generateNewFilename, findDuplicateFilenames } from '../utils/fileHelpers';
import DaluxApiClient from '../api/daluxApi';

// ── Per-file status row ────────────────────────────────────────────────────────

function StatusIcon({ status }) {
  switch (status) {
    case 'done':      return <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />;
    case 'failed':    return <XCircle     className="w-4 h-4 text-red-500   flex-shrink-0" />;
    case 'uploading': return <Loader2     className="w-4 h-4 text-blue-500  flex-shrink-0 animate-spin" />;
    case 'retrying':  return <RefreshCw   className="w-4 h-4 text-orange-500 flex-shrink-0 animate-spin" />;
    default:          return <Clock       className="w-4 h-4 text-slate-400  flex-shrink-0" />;
  }
}

function UploadProgressList({ statuses }) {
  const entries = Object.values(statuses);
  if (entries.length === 0) return null;

  const done    = entries.filter(s => s.status === 'done').length;
  const failed  = entries.filter(s => s.status === 'failed').length;
  const total   = entries.length;
  const pct     = Math.round((done + failed) / total * 100);

  return (
    <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
      {/* Progress bar */}
      <div className="h-2 bg-slate-100">
        <div
          className="h-2 bg-blue-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Summary line */}
      <div className="px-3 py-2 bg-slate-50 border-b text-xs text-slate-600 flex gap-4">
        <span>Skupaj: {total}</span>
        <span className="text-green-700">✓ {done}</span>
        {failed > 0 && <span className="text-red-600">✗ {failed}</span>}
        <span className="text-slate-400 ml-auto">{pct}%</span>
      </div>

      {/* Per-file rows */}
      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
        {entries.map((s, i) => (
          <div key={i} className={`flex items-start gap-2 px-3 py-2 text-sm ${
            s.status === 'done'   ? 'bg-green-50' :
            s.status === 'failed' ? 'bg-red-50'   : 'bg-white'
          }`}>
            <StatusIcon status={s.status} />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-slate-700">{s.file}</p>
              <p className="text-xs text-slate-400 truncate">{s.folder}</p>
              {s.status === 'retrying' && (
                <p className="text-xs text-orange-600 mt-0.5">Poskus {s.attempt}/3…</p>
              )}
              {s.status === 'failed' && s.error && (
                <p className="text-xs text-red-600 mt-0.5 break-words">{s.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const DownloadSection = ({ files, projektSifra, projektId, daluxConnected }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [fileStatuses, setFileStatuses] = useState({});
  const [duplicatesAcknowledged, setDuplicatesAcknowledged] = useState(false);

  const completeFiles   = files.filter(f => isFileComplete(f));
  const incompleteFiles = files.filter(f => !isFileComplete(f));
  const duplicates      = findDuplicateFilenames(completeFiles, projektSifra);
  const hasDuplicates   = duplicates.length > 0;

  const handleUploadToDalux = async () => {
    setUploading(true);
    setUploadResults(null);

    // Pre-populate all files as pending so the list appears immediately
    const initialStatuses = {};
    const filesDict = {};
    completeFiles.forEach(file => {
      const filename = generateNewFilename(file, projektSifra);
      const folder   = file.target_subfolder;
      const key      = `${folder}/${filename}`;
      initialStatuses[key] = { file: filename, folder, status: 'pending', attempt: 0 };
      if (!filesDict[folder]) filesDict[folder] = [];
      filesDict[folder].push([filename, file.content]);
    });
    setFileStatuses(initialStatuses);

    const onFileStatus = (filename, folder, status, attempt, error) => {
      const key = `${folder}/${filename}`;
      setFileStatuses(prev => ({ ...prev, [key]: { file: filename, folder, status, attempt, error } }));
    };

    try {
      const client  = new DaluxApiClient();
      const results = await client.bulkUploadFromStructure(projektId || projektSifra, filesDict, onFileStatus);
      setUploadResults(results);
    } catch (error) {
      setUploadResults({ success: 0, failed: completeFiles.length, details: [], error: error.message });
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
          <p className="text-green-800 font-medium">🎉 Vse datoteke so pripravljene!</p>
        </div>
      )}

      {/* Incomplete files */}
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
                    if (!file.tip)              missing.push('TIP');
                    if (!file.faza)             missing.push('FAZA');
                    if (!file.vlo)              missing.push('VLO');
                    if (!file.ime)              missing.push('IME');
                    if (!file.target_subfolder) missing.push('Podmapa');
                    return (
                      <div key={idx} className="p-2 bg-white rounded border border-yellow-200">
                        <p className="font-medium text-yellow-900">{file.original_name}</p>
                        <p className="text-xs text-yellow-700 mt-1">Manjka: {missing.join(', ')}</p>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate filename warning */}
      {hasDuplicates && !duplicatesAcknowledged && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-300 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-orange-800 font-medium mb-1">
                ⚠️ {duplicates.length} podvojen{duplicates.length === 1 ? 'o' : 'ih'} ime{duplicates.length !== 1 ? ' datotek' : ' datoteke'}
              </p>
              <p className="text-sm text-orange-700 mb-2">
                Naslednje datoteke bodo generirale enako izhodno ime — zadnja bo prepisala prejšnjo.
              </p>
              <details className="text-sm mb-3">
                <summary className="cursor-pointer text-orange-700 hover:text-orange-900 font-medium">
                  Prikaži podrobnosti
                </summary>
                <div className="mt-2 space-y-2">
                  {duplicates.map((d, i) => (
                    <div key={i} className="p-2 bg-white rounded border border-orange-200">
                      <p className="font-mono text-xs font-semibold text-orange-900">{d.outputName}</p>
                      <p className="text-xs text-orange-700 mt-0.5">← {d.sources.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </details>
              <button
                onClick={() => setDuplicatesAcknowledged(true)}
                className="text-sm px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
              >
                Razumem, nadaljuj vseeno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dalux Upload */}
      {completeFiles.length > 0 && (
        <div>
          {!daluxConnected ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800">⚠️ Dalux povezava je že vzpostavljena preko projekta</p>
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
                disabled={uploading || (hasDuplicates && !duplicatesAcknowledged)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-4 px-6 rounded-lg transition flex items-center justify-center gap-3"
              >
                {uploading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> NALAGAM V DALUX…</>
                  : <><Cloud className="w-5 h-5" /> NALOŽI V DALUX</>}
              </button>

              {/* Live per-file progress */}
              {Object.keys(fileStatuses).length > 0 && (
                <UploadProgressList statuses={fileStatuses} />
              )}

              {/* Final summary */}
              {uploadResults && !uploading && (
                <div className="mt-4">
                  {uploadResults.error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium">❌ Napaka pri nalaganju:</p>
                      <p className="text-sm text-red-700 mt-1">{uploadResults.error}</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">
                        ✅ Uspešno naloženih: {uploadResults.success}
                      </p>
                      {uploadResults.failed > 0 && (
                        <p className="text-red-700 mt-1">❌ Neuspešnih: {uploadResults.failed}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DownloadSection;
