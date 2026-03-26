// src/App.jsx

import React, { useState } from 'react';
import { useFileManager } from './hooks/useFileManager';
import DaluxManager from './components/DaluxManager';
import DaluxExport from './components/DaluxExport';
import FileUploader from './components/FileUploader';
import FileList from './components/FileList';
import FileEditor from './components/FileEditor';
import DownloadSection from './components/DownloadSection';
import Sidebar from './components/Sidebar';
import PasswordGate from './components/PasswordGate';
import { getPassword } from './utils/auth';
import { Settings, ArrowLeft } from 'lucide-react';

function App() {
  const [authenticated, setAuthenticated] = useState(!!getPassword());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTool, setCurrentTool] = useState(null); // null | 'rename' | 'export'
  const [selectedProject, setSelectedProject] = useState(null); // Store full project info

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

  // Handle tool selection from DaluxManager
  const handleToolSelect = (toolId, projectNumber, projectId, projectName) => {
    setCurrentTool(toolId);
    setSelectedProject({ number: projectNumber, id: projectId, name: projectName });
    startProject(projectNumber, projectId);
  };

  // Handle back to manager
  const handleBackToManager = () => {
    setCurrentTool(null);
    setSelectedProject(null);
    resetProject();
  };

  // If no tool selected, show DaluxManager
  if (!currentTool || !projektStarted) {
    return <DaluxManager onToolSelect={handleToolSelect} />;
  }

  // Show DaluxExport tool
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


  // Show File Rename tool (existing functionality)
  const stats = getStats();
  const currentFile = files[currentIndex];

  const handleFilesAdded = async (uploadedFiles) => {
    const added = await addFiles(uploadedFiles);
    return added;
  };

  const handleNavigate = (newIndex) => {
    if (newIndex >= 0 && newIndex < files.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleDeleteFile = (index) => {
    removeFile(index);
  };

  const handleClearAll = () => {
    if (window.confirm('Ste prepričani, da želite odstraniti vse datoteke?')) {
      clearAllFiles();
    }
  };

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
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToManager}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Nazaj
              </button>

              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg shadow transition"
              >
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
            />
          </div>

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
            daluxApiKey={daluxApiKey}
            daluxConnected={daluxConnected}
          />
        </div>
      </div>

      {/* Sidebar */}
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