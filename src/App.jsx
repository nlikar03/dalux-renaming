// src/App.jsx

import React, { useState, useEffect } from 'react';
import { useFileManager } from './hooks/useFileManager';
import DaluxManager from './components/DaluxManager';
import DaluxExport from './components/DaluxExport';
import FileUploader from './components/FileUploader';
import FileList from './components/FileList';
import FileEditor from './components/FileEditor';
import DownloadSection from './components/DownloadSection';
import Sidebar from './components/Sidebar';
import PasswordGate from './components/PasswordGate';
import BatchEditPanel from './components/BatchEditPanel';
import { getPassword } from './utils/auth';
import { Settings, ArrowLeft, FileText } from 'lucide-react';
import FileMetadataModal from './components/FileMetadataModal';

const FILES_PER_PAGE = 10;

function App() {
  const [authenticated, setAuthenticated] = useState(!!getPassword());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  const {
    files,
    currentIndex,
    currentPage,
    projektSifra,
    projektStarted,
    daluxApiKey,
    daluxConnected,
    daluxProjectId,
    tipOptions,
    fazaOptions,
    vloOptions,
    addFiles,
    removeFile,
    updateFile,
    updateFiles,
    clearAllFiles,
    setCurrentIndex,
    setCurrentPage,
    getStats,
    addCustomOption,
    startProject,
    resetProject
  } = useFileManager();

  if (!authenticated) {
    return <PasswordGate onAuthenticated={() => setAuthenticated(true)} />;
  }

  const handleToolSelect = (toolId, projectNumber, projectId, projectName) => {
    setCurrentTool(toolId);
    setSelectedProject({ number: projectNumber, id: projectId, name: projectName });
    startProject(projectNumber, projectId);
  };

  const handleBackToManager = () => {
    setCurrentTool(null);
    setSelectedProject(null);
    resetProject();
  };

  if (!currentTool || !projektStarted) {
    return <DaluxManager onToolSelect={handleToolSelect} />;
  }

  if (currentTool === 'export') {
    return (
      <DaluxExport
        projektSifra={projektSifra}
        projektId={daluxProjectId}
        projektName={selectedProject?.name || ''}
        onBack={handleBackToManager}
      />
    );
  }

  // ── Rename tool ──────────────────────────────────────────────────────────────

  const stats = getStats();
  const currentFile = files[currentIndex];

  const handleFilesAdded = async (uploadedFiles) => addFiles(uploadedFiles);

  const handleNavigate = (newIndex) => {
    if (newIndex >= 0 && newIndex < files.length) {
      setCurrentIndex(newIndex);
      const newPage = Math.floor(newIndex / FILES_PER_PAGE);
      if (newPage !== currentPage) setCurrentPage(newPage);
    }
  };

  const handleDeleteFile = (index) => {
    removeFile(index);
    setSelectedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Ste prepričani, da želite odstraniti vse datoteke?')) {
      clearAllFiles();
      setSelectedIndices(new Set());
    }
  };

  // ── Batch selection helpers ──────────────────────────────────────────────────

  const handleToggleSelect = (idx) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSelectAllPage = (pageIndices, select) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      pageIndices.forEach(i => select ? next.add(i) : next.delete(i));
      return next;
    });
  };

  const handleBatchApply = (updates) => {
    updateFiles([...selectedIndices], updates);
    setSelectedIndices(new Set());
  };

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  // Arrow keys move between files when no input/select/textarea is focused.

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNavigate(currentIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNavigate(currentIndex - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, currentPage, files.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Preimenovanje Projektnih Datotek</h1>
              <p className="text-slate-300 text-sm mt-1">
                Projekt: <strong>{projektSifra}</strong>
                {selectedProject?.name && <span> — {selectedProject.name}</span>}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleBackToManager}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" /> Nazaj
              </button>
              <button onClick={() => setShowMetadataModal(true)}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" /> Uredi metapodatke
              </button>
              <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg shadow transition">
                <Settings className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Row 1: Uploader and File List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FileUploader onFilesAdded={handleFilesAdded} />
            <FileList
              files={files}
              currentIndex={currentIndex}
              currentPage={currentPage}
              onSelectFile={setCurrentIndex}
              onDeleteFile={handleDeleteFile}
              onPageChange={setCurrentPage}
              selectedIndices={selectedIndices}
              onToggleSelect={handleToggleSelect}
              onSelectAllPage={handleSelectAllPage}
            />
          </div>

          {/* Batch edit panel — visible only when files are selected */}
          {selectedIndices.size > 0 && (
            <BatchEditPanel
              selectedCount={selectedIndices.size}
              tipOptions={tipOptions}
              fazaOptions={fazaOptions}
              vloOptions={vloOptions}
              onApply={handleBatchApply}
              onClear={() => setSelectedIndices(new Set())}
            />
          )}

          {/* Row 2: File Editor */}
          <FileEditor
            file={currentFile}
            index={currentIndex}
            total={files.length}
            tipOptions={tipOptions}
            fazaOptions={fazaOptions}
            vloOptions={vloOptions}
            projektSifra={projektSifra}
            projektId={daluxProjectId}
            onUpdate={updateFile}
            onNavigate={handleNavigate}
          />

          {/* Row 3: Download Section */}
          <DownloadSection
            files={files}
            projektSifra={projektSifra}
            projektId={daluxProjectId}
            daluxApiKey={daluxApiKey}
            daluxConnected={daluxConnected}
          />
        </div>
      </div>

      {showMetadataModal && (
        <FileMetadataModal
          projektId={daluxProjectId}
          projektSifra={projektSifra}
          onClose={() => setShowMetadataModal(false)}
        />
      )}

      <Sidebar
        projektSifra={projektSifra}
        daluxConnected={daluxConnected}
        daluxProjectId={daluxProjectId}
        stats={stats}
        onResetProject={handleBackToManager}
        onClearAll={handleClearAll}
        onAddCustomOption={addCustomOption}
        isCollapsed={isSidebarCollapsed}
      />
    </div>
  );
}

export default App;
