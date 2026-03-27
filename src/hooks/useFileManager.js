import { useState, useEffect, useRef } from 'react';
import { TIP_OPTIONS, FAZA_OPTIONS, VLO_OPTIONS } from '../utils/constants';
import { createFileObject, isFileComplete } from '../utils/fileHelpers';

// ── IndexedDB helpers ──────────────────────────────────────────────────────────

const IDB_NAME = 'kolektor-session';
const IDB_STORE = 'draft';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function idbSave(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(data, 'session');
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

async function idbLoad() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get('session');
      req.onsuccess = e => resolve(e.target.result || null);
      req.onerror = e => reject(e.target.error);
    });
  } catch { return null; }
}

async function idbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

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

  // Track whether IDB has finished loading (don't save before load completes)
  const idbLoaded = useRef(false);
  const saveTimer = useRef(null);

  // Load persisted session from IndexedDB on mount
  useEffect(() => {
    idbLoad().then(saved => {
      if (saved) {
        if (saved.files?.length)        setFiles(saved.files);
        if (saved.currentIndex != null) setCurrentIndex(saved.currentIndex);
        if (saved.currentPage != null)  setCurrentPage(saved.currentPage);
        if (saved.tipOptions)           setTipOptions(saved.tipOptions);
        if (saved.fazaOptions)          setFazaOptions(saved.fazaOptions);
        if (saved.vloOptions)           setVloOptions(saved.vloOptions);
      }
    }).catch(() => {}).finally(() => { idbLoaded.current = true; });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to IndexedDB whenever relevant state changes (debounced 600 ms)
  useEffect(() => {
    if (!idbLoaded.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      idbSave({ files, currentIndex, currentPage, tipOptions, fazaOptions, vloOptions })
        .catch(e => console.warn('IDB save failed:', e));
    }, 600);
  }, [files, currentIndex, currentPage, tipOptions, fazaOptions, vloOptions]);

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
   * Batch update multiple files — single state write so IDB debounce fires once
   */
  const updateFiles = (indices, updates) => {
    setFiles(prev => {
      const next = [...prev];
      indices.forEach(i => { next[i] = { ...next[i], ...updates }; });
      return next;
    });
  };

  /**
   * Remove multiple files by index in one state write
   */
  const removeFiles = (indices) => {
    const indexSet = new Set(indices);
    setFiles(prev => prev.filter((_, i) => !indexSet.has(i)));
    setCurrentIndex(prev => {
      if (indexSet.has(prev)) return 0;
      const removedBefore = [...indexSet].filter(i => i < prev).length;
      return Math.max(0, prev - removedBefore);
    });
    setCurrentPage(0);
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
  const startProject = (sifra, projectId) => {
    setProjektSifra(sifra);
    setDaluxProjectId(projectId);
    setDaluxConnected(true);
    setProjektStarted(true);
  };

  /**
   * Reset project (also wipes the persisted draft)
   */
  const resetProject = () => {
    setProjektSifra('');
    setDaluxApiKey('');
    setDaluxProjectId('');
    setDaluxConnected(false);
    setProjektStarted(false);
    clearAllFiles();
    idbClear().catch(e => console.warn('IDB clear failed:', e));
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
    updateFiles,
    removeFiles,
    clearAllFiles,
    setCurrentIndex,
    setCurrentPage,
    getStats,
    addCustomOption,
    startProject,
    resetProject
  };
};