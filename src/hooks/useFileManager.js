import { useState } from 'react';
import { TIP_OPTIONS, FAZA_OPTIONS, VLO_OPTIONS } from '../utils/constants';
import { createFileObject, isFileComplete } from '../utils/fileHelpers';

export const useFileManager = () => {
  const [files, setFiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [projektSifra, setProjektSifra] = useState('');
  const [projektStarted, setProjektStarted] = useState(false);
  
  // Dalux state
  const [daluxApiKey, setDaluxApiKey] = useState('');
  const [daluxConnected, setDaluxConnected] = useState(false);
  const [daluxProjectId, setDaluxProjectId] = useState('');
  
  // Custom options (user can add their own)
  const [tipOptions, setTipOptions] = useState(TIP_OPTIONS);
  const [fazaOptions, setFazaOptions] = useState(FAZA_OPTIONS);
  const [vloOptions, setVloOptions] = useState(VLO_OPTIONS);

  /**
   * Add files to processing list
   */
  const addFiles = async (uploadedFiles) => {
    const existingNames = files.map(f => f.original_name);
    const newFiles = [];

    for (const file of uploadedFiles) {
      if (!existingNames.includes(file.name)) {
        const fileObj = await createFileObject(file);
        newFiles.push(fileObj);
      }
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      return newFiles.length;
    }
    return 0;
  };

  /**
   * Remove file at index
   */
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    
    // Adjust current index if needed
    if (files.length > 1) {
      if (currentIndex >= files.length - 1) {
        setCurrentIndex(Math.max(0, files.length - 2));
      }
    } else {
      setCurrentIndex(0);
    }

    // Adjust page if needed
    const filesPerPage = 10;
    const newTotalPages = Math.ceil((files.length - 1) / filesPerPage);
    if (currentPage >= newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages - 1);
    }
  };

  /**
   * Update file metadata
   */
  const updateFile = (index, updates) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], ...updates };
      return newFiles;
    });
  };

  /**
   * Clear all files
   */
  const clearAllFiles = () => {
    setFiles([]);
    setCurrentIndex(0);
    setCurrentPage(0);
  };

  /**
   * Get statistics
   */
  const getStats = () => {
    const complete = files.filter(f => isFileComplete(f)).length;
    const incomplete = files.length - complete;
    return { total: files.length, complete, incomplete };
  };

  /**
   * Add custom option to dropdowns
   */
  const addCustomOption = (type, code, description) => {
    code = code.trim().toUpperCase();
    description = description.trim();

    if (!code || !description) {
      return { success: false, message: '❌ Vnesi kodo in opis' };
    }

    if (code.length !== 3) {
      return { success: false, message: '❌ Koda mora imeti 3 črke' };
    }

    const setterMap = {
      TIP: setTipOptions,
      FAZA: setFazaOptions,
      VLO: setVloOptions
    };

    const optionsMap = {
      TIP: tipOptions,
      FAZA: fazaOptions,
      VLO: vloOptions
    };

    if (optionsMap[type][code]) {
      return { success: false, message: '❌ Ta koda že obstaja' };
    }

    setterMap[type](prev => ({ ...prev, [code]: description }));
    return { success: true, message: `✅ Dodano: ${code} — ${description}` };
  };

  /**
   * Start new project
   */
  const startProject = (sifra, apiKey, projectId) => {
    setProjektSifra(sifra);
    setDaluxApiKey(apiKey);
    setDaluxProjectId(projectId);
    setDaluxConnected(true);
    setProjektStarted(true);
  };

  /**
   * Reset project
   */
  const resetProject = () => {
    setProjektSifra('');
    setDaluxApiKey('');
    setDaluxProjectId('');
    setDaluxConnected(false);
    setProjektStarted(false);
    clearAllFiles();
  };

  return {
    // State
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
    
    // Actions
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
  };
};