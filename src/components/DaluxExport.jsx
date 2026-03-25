import React, { useState, useEffect } from 'react';
import { Download, ArrowLeft, FileText, CheckSquare, Folder, Loader2, AlertCircle, CheckCircle2, XCircle, Calendar, Filter } from 'lucide-react';
import DaluxApiClient from '../api/daluxApi';

const DaluxExport = ({ projektSifra, projektId, projektName, onBack }) => {
  const [fileAreas, setFileAreas] = useState([]);
  const [selectedFileArea, setSelectedFileArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [progressInfo, setProgressInfo] = useState(null);
  
  // Download options
  const [downloadAll, setDownloadAll] = useState(false);
  const [downloadFiles, setDownloadFiles] = useState(true);
  const [downloadForms, setDownloadForms] = useState(false);
  const [downloadTasks, setDownloadTasks] = useState(false);
  const [includeFormAttachments, setIncludeFormAttachments] = useState(false);
  
  // NEW: Date filtering options
  const [enableDateFilter, setEnableDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');  // Start date (YYYY-MM-DD)
  const [endDate, setEndDate] = useState('');      // End date (YYYY-MM-DD)
  const [dateField, setDateField] = useState('lastModified'); // or 'uploaded'

  const client = new DaluxApiClient();

  // Load file areas on mount
  useEffect(() => {
    loadFileAreas();
  }, []);

  const loadFileAreas = async () => {
    setLoading(true);
    setError('');
    try {
      const areas = await client.getFileAreas(projektSifra);
      setFileAreas(areas);
      if (areas.length > 0) {
        setSelectedFileArea(areas[0].data.fileAreaId);
      }
    } catch (err) {
      setError('Napaka pri nalaganju file areas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = (checked) => {
    setDownloadAll(checked);
    if (checked) {
      setDownloadFiles(true);
      setDownloadForms(true);
      setDownloadTasks(true);
    }
  };

  const canDownload = downloadFiles || downloadForms || downloadTasks;

  const handleStartDownload = async () => {
    if (!canDownload) return;
    
    // Validate date filter if enabled
    if (enableDateFilter && !startDate && !endDate) {
      setError('Prosim izberi vsaj en datum za filtriranje');
      return;
    }
    
    // Validate date range if both dates are set
    if (enableDateFilter && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        setError('Začetni datum ne more biti večji od končnega datuma');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    setDownloadStatus(null);
    setProgressInfo(null);

    const activeStartDate = enableDateFilter ? startDate : null;
    const activeEndDate = enableDateFilter ? endDate : null;

    try {
      if (downloadAll || (downloadFiles && downloadForms && downloadTasks)) {
        // Download everything
        setDownloadStatus({ type: 'progress', message: 'Pripravljam celoten download...' });
        
        const { blob, filename } = await client.downloadAll(
          projektSifra,
          selectedFileArea,
          downloadFiles,
          downloadForms,
          downloadTasks,
          includeFormAttachments,
          activeStartDate,
          activeEndDate,
          dateField
        );
        
        client.downloadBlob(blob, filename);
        
        // Build success message
        let dateRangeMsg = '';
        if (activeStartDate && activeEndDate) {
          dateRangeMsg = ` (${activeStartDate} do ${activeEndDate})`;
        } else if (activeStartDate) {
          dateRangeMsg = ` (od ${activeStartDate})`;
        } else if (activeEndDate) {
          dateRangeMsg = ` (do ${activeEndDate})`;
        }
        
        setDownloadStatus({ 
          type: 'success', 
          message: `Uspešno preneseno: ${filename}${dateRangeMsg}`,
          details: {
            files: downloadFiles,
            forms: downloadForms,
            tasks: downloadTasks,
            filtered: !!(activeStartDate || activeEndDate)
          }
        });
      } else {
        // Download individually
        const results = [];

        if (downloadFiles) {
          setDownloadStatus({ type: 'progress', message: 'Prenašam datoteke...' });
          
          // Use streaming download with progress
          const { blob, filename } = await client.downloadFilesWithProgress(
            projektSifra, 
            selectedFileArea,
            activeStartDate,
            activeEndDate,
            dateField,
            (progressData) => {
              // Update progress info
              setProgressInfo(progressData);
              
              if (progressData.stage === 'fetching') {
                setDownloadStatus({ 
                  type: 'progress', 
                  message: `Pridobivam datoteke (stran ${progressData.page})...` 
                });
              } else if (progressData.stage === 'filtering') {
                setDownloadStatus({ 
                  type: 'progress', 
                  message: progressData.message
                });
              } else if (progressData.stage === 'downloading') {
                setDownloadStatus({ 
                  type: 'progress', 
                  message: `Prenašam datoteke (${progressData.current}/${progressData.total})...` 
                });
              } else if (progressData.stage === 'zipping') {
                setDownloadStatus({ 
                  type: 'progress', 
                  message: 'Ustvarjam ZIP arhiv...' 
                });
              }
            }
          );
          
          client.downloadBlob(blob, filename);
          results.push({ type: 'Files', filename });
        }

        if (downloadForms) {
          setProgressInfo(null);
          setDownloadStatus({ type: 'progress', message: 'Prenašam forme...' });
          const { blob, filename } = await client.downloadForms(projektSifra, includeFormAttachments);
          client.downloadBlob(blob, filename);
          results.push({ type: 'Forms', filename });
        }

        if (downloadTasks) {
          setProgressInfo(null);
          setDownloadStatus({ type: 'progress', message: 'Prenašam task-e...' });
          const { blob, filename } = await client.downloadTasks(projektSifra);
          client.downloadBlob(blob, filename);
          results.push({ type: 'Tasks', filename });
        }

        setProgressInfo(null);
        
        // Build success message
        let dateRangeMsg = '';
        if (activeStartDate && activeEndDate) {
          dateRangeMsg = ` (${activeStartDate} do ${activeEndDate})`;
        } else if (activeStartDate) {
          dateRangeMsg = ` (od ${activeStartDate})`;
        } else if (activeEndDate) {
          dateRangeMsg = ` (do ${activeEndDate})`;
        }
        
        setDownloadStatus({ 
          type: 'success', 
          message: `Vsi download-i uspešni${dateRangeMsg}`,
          results 
        });
      }
    } catch (err) {
      setError('Download napaka: ' + err.message);
      setDownloadStatus({ type: 'error', message: err.message });
      setProgressInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dalux Export</h1>
            <p className="text-slate-300 text-sm mt-1">
              Projekt: <strong>{projektSifra}</strong>
              {projektName && <span> - {projektName}</span>}
            </p>
          </div>
          <button
            onClick={onBack}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Nazaj
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* File Area Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            1. Izberi File Area
          </h2>
          
          {loading && !fileAreas.length && (
            <div className="text-slate-600 flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Nalagam file areas...
            </div>
          )}

          {fileAreas.length > 0 && (
            <select
              value={selectedFileArea}
              onChange={(e) => setSelectedFileArea(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              {fileAreas.map((area) => (
                <option key={area.data.fileAreaId} value={area.data.fileAreaId}>
                  {area.data.fileAreaName} ({area.data.fileAreaType})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* NEW: Date Filter Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-6 h-6 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-800">
              Filtriraj po Datumu (Opcijsko)
            </h2>
          </div>

          <div className="space-y-4">
            {/* Enable Date Filter Toggle */}
            <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={enableDateFilter}
                onChange={(e) => setEnableDateFilter(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-semibold text-slate-800">Omogoči datum filtriranje</div>
                <div className="text-sm text-slate-600">
                  Prenesi samo datoteke med izbranimi datumi
                </div>
              </div>
            </label>

            {/* Date Selection */}
            {enableDateFilter && (
              <div className="ml-4 space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date Picker */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Začetni datum (od)  (DD. MM. YYYY)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || undefined}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                    {startDate && (
                      <p className="text-xs text-slate-600 mt-2">
                        Vključno od (YYYY-MM-DD) <strong>{startDate}</strong>
                      </p>
                    )}
                  </div>

                  {/* End Date Picker */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Končni datum (do) (DD. MM. YYYY)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                    {endDate ? (
                      <p className="text-xs text-slate-600 mt-2">
                        Vključno do <strong>{endDate}</strong>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-2">
                        Prazno = do danes
                      </p>
                    )}
                  </div>
                </div>

                {/* Date Range Summary */}
                {(startDate || endDate) && (
                  <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <div className="flex items-start gap-2 text-sm text-blue-800">
                      <Filter className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Izbran razpon:</strong>{' '}
                        {startDate && endDate ? (
                          <span>{startDate} do {endDate}</span>
                        ) : startDate ? (
                          <span>Od {startDate} naprej</span>
                        ) : (
                          <span>Do {endDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Date Field Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tip datuma za filtriranje
                  </label>
                  <select
                    value={dateField}
                    onChange={(e) => setDateField(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="lastModified">Datum zadnje spremembe</option>
                    <option value="uploaded">Datum nalaganja</option>
                  </select>
                  <p className="text-xs text-slate-600 mt-2">
                    {dateField === 'lastModified' 
                      ? 'Filtriraj glede na datum zadnje spremembe datoteke'
                      : 'Filtriraj glede na datum nalaganja datoteke'}
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-sm text-yellow-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Opomba:</strong> Datum filtriranje deluje samo za Files. 
                      Forms in Tasks bodo preneseni v celoti ne glede na izbran datum.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Download Options */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            2. Izberi Podatke za Download
          </h2>

          <div className="space-y-4">
            {/* Download All */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="downloadAll"
                checked={downloadAll}
                onChange={(e) => handleDownloadAll(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="downloadAll" className="flex-1 cursor-pointer">
                <div className="font-semibold text-slate-800">Download All</div>
                <div className="text-sm text-slate-600">Prenesi vse v enem ZIP-u</div>
              </label>
            </div>

            {/* Individual Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Files */}
              <div className={`p-4 border-2 rounded-lg transition ${
                downloadFiles ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
              } ${downloadAll ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => !downloadAll && setDownloadFiles(!downloadFiles)}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={downloadFiles}
                    onChange={(e) => setDownloadFiles(e.target.checked)}
                    disabled={downloadAll}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Folder className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-slate-800">Files</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Vse projektne datoteke s strukturo map
                    </p>
                    {enableDateFilter && (startDate || endDate) && downloadFiles && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {startDate && endDate ? (
                          <span>{startDate} do {endDate}</span>
                        ) : startDate ? (
                          <span>Od {startDate}</span>
                        ) : (
                          <span>Do {endDate}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Forms */}
              <div className={`p-4 border-2 rounded-lg transition ${
                downloadForms ? 'border-green-500 bg-green-50' : 'border-slate-200'
              } ${downloadAll ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => !downloadAll && setDownloadForms(!downloadForms)}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={downloadForms}
                    onChange={(e) => setDownloadForms(e.target.checked)}
                    disabled={downloadAll}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-slate-800">Forms</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Inspection plans (JSON format)
                    </p>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className={`p-4 border-2 rounded-lg transition ${
                downloadTasks ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
              } ${downloadAll ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => !downloadAll && setDownloadTasks(!downloadTasks)}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={downloadTasks}
                    onChange={(e) => setDownloadTasks(e.target.checked)}
                    disabled={downloadAll}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-slate-800">Tasks</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Tasks, attachments, changes (JSON)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Attachments Option */}
            {(downloadForms || downloadAll) && (
              <div className="ml-4 mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFormAttachments}
                    onChange={(e) => setIncludeFormAttachments(e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-slate-800">Vključi Form Attachments</div>
                    <div className="text-sm text-slate-600">
                      Poveži attachmente z formami po formId
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Download Button */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            3. Začni Download
          </h2>

          <button
            onClick={handleStartDownload}
            disabled={!canDownload || loading}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition flex items-center justify-center gap-3 ${
              canDownload && !loading
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Prenašam...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                {enableDateFilter && (startDate || endDate) ? (
                  startDate && endDate ? (
                    `Začni Download (${startDate} - ${endDate})`
                  ) : startDate ? (
                    `Začni Download (od ${startDate})`
                  ) : (
                    `Začni Download (do ${endDate})`
                  )
                ) : (
                  'Začni Download'
                )}
              </>
            )}
          </button>

          {!canDownload && !loading && (
            <p className="text-sm text-slate-600 text-center mt-3">
              Izberi vsaj eno možnost za download
            </p>
          )}
        </div>

        {/* Download Status */}
        {downloadStatus && (
          <div className={`rounded-xl shadow-lg p-6 ${
            downloadStatus.type === 'success' ? 'bg-green-50 border border-green-200' :
            downloadStatus.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {downloadStatus.type === 'success' && <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />}
              {downloadStatus.type === 'error' && <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />}
              {downloadStatus.type === 'progress' && <Loader2 className="w-6 h-6 text-blue-600 flex-shrink-0 animate-spin" />}
              
              <div className="flex-1">
                <div className="font-semibold text-slate-800 mb-2">
                  {downloadStatus.type === 'success' && 'Download Uspešen'}
                  {downloadStatus.type === 'error' && 'Download Napaka'}
                  {downloadStatus.type === 'progress' && 'V Teku'}
                </div>
                <div className="text-slate-700">{downloadStatus.message}</div>

                {/* Progress Bar for File Downloads */}
                {progressInfo && progressInfo.stage === 'downloading' && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Trenutna datoteka: <strong>{progressInfo.filename}</strong></span>
                      <span>{progressInfo.current} / {progressInfo.total}</span>
                    </div>
                    
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${(progressInfo.current / progressInfo.total) * 100}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Uspešno: {progressInfo.success}</span>
                      {progressInfo.failed > 0 && <span className="text-red-600">Napake: {progressInfo.failed}</span>}
                    </div>
                  </div>
                )}

                {/* Filtering Progress */}
                {progressInfo && progressInfo.stage === 'filtering' && (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Filter className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-800">
                        <strong>{progressInfo.message}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Page Fetching Counter */}
                {progressInfo && progressInfo.stage === 'fetching' && (
                  <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-blue-800">
                        Pridobivam seznam datotek... <strong>Stran {progressInfo.page}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {progressInfo && progressInfo.stage === 'zipping' && (
                  <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-blue-800">Ustvarjam ZIP arhiv...</span>
                    </div>
                  </div>
                )}

                {downloadStatus.results && (
                  <div className="mt-3 space-y-2">
                    {downloadStatus.results.map((result, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{result.type}:</span>
                        <span className="text-slate-600">{result.filename}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-100 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Navodila za uporabo:</h3>
          <ol className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2">
              <span className="font-semibold">1.</span>
              <span>Izberi file area iz dropdown menija</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">2.</span>
              <span>(Opcijsko) Omogoči datum filtriranje - izberi začetni in/ali končni datum za datoteke</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">3.</span>
              <span>Označi podatke, ki jih želiš prenesti (Files, Forms, Tasks)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">4.</span>
              <span>Opcija "Download All" prenese vse podatke v enem ZIP-u</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">5.</span>
              <span>Pri Forms lahko vključiš tudi attachmente (povezani po formId)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">6.</span>
              <span>Klikni "Začni Download" - datoteke se bodo avtomatsko prenesle</span>
            </li>
          </ol>
          
          {/* Date Filter Note */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-blue-800">
                <strong>Datum filtriranje:</strong> Prenesi datoteke znotraj določenega časovnega razpona. 
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Samo <strong>začetni datum</strong>: Od tega datuma naprej (vključno)</li>
                  <li>Samo <strong>končni datum</strong>: Do tega datuma (vključno)</li>
                  <li><strong>Oba datuma</strong>: Datoteke med tema datumoma</li>
                </ul>
                Mapna struktura je ohranjena.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaluxExport;