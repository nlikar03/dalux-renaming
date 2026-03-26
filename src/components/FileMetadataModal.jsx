import React, { useState, useEffect, useMemo } from 'react';
import { X, Folder, FolderOpen, ChevronRight, ChevronDown, Edit3, Save, Loader2, AlertCircle, CheckCircle2, FileText, Eye } from 'lucide-react';
import DaluxApiClient from '../api/daluxApi';
import FolderTreePicker from './FolderTreePicker';
import { TIP_OPTIONS, FAZA_OPTIONS, VLO_OPTIONS } from '../utils/constants';

// ── Inline folder tree (always visible, sidebar) ───────────────────────────────

function buildTree(folders) {
  const map = {};
  const roots = [];
  (folders || []).forEach(f => { map[f.folderId] = { ...f, children: [] }; });
  (folders || []).forEach(f => {
    if (f.parentId && map[f.parentId]) map[f.parentId].children.push(map[f.folderId]);
    else roots.push(map[f.folderId]);
  });
  const sort = ns => { ns.sort((a, b) => a.name.localeCompare(b.name)); ns.forEach(n => sort(n.children)); return ns; };
  return sort(roots);
}

function SidebarNode({ node, depth, selectedFolderId, expanded, onToggle, onSelect }) {
  const isExpanded = expanded.has(node.folderId);
  const isSelected = selectedFolderId === node.folderId;
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div>
      <div
        onClick={() => onSelect(node.folderId)}
        className={`flex items-center gap-1 py-1.5 pr-2 cursor-pointer rounded-md transition-colors text-sm ${
          isSelected ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-slate-100 text-slate-700'
        }`}
        style={{ paddingLeft: `${6 + depth * 14}px` }}
      >
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0"
          onClick={e => { e.stopPropagation(); hasChildren && onToggle(node.folderId); }}>
          {hasChildren ? (isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />) : null}
        </span>
        {isExpanded && hasChildren ? <FolderOpen className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" /> : <Folder className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
        <span className="truncate ml-0.5">{node.name}</span>
      </div>
      {isExpanded && hasChildren && node.children.map(c => (
        <SidebarNode key={c.folderId} node={c} depth={depth+1} selectedFolderId={selectedFolderId}
          expanded={expanded} onToggle={onToggle} onSelect={onSelect} />
      ))}
    </div>
  );
}

function SidebarTree({ folders, selectedFolderId, onSelect }) {
  const [expanded, setExpanded] = useState(new Set());
  const tree = useMemo(() => buildTree(folders), [folders]);
  const toggle = id => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div className="select-none">
      {tree.map(node => (
        <SidebarNode key={node.folderId} node={node} depth={0}
          selectedFolderId={selectedFolderId} expanded={expanded} onToggle={toggle} onSelect={onSelect} />
      ))}
    </div>
  );
}

// ── Parse filename into metadata components ────────────────────────────────────

function parseFilenameToMeta(fileName) {
  const dotIdx = fileName.lastIndexOf('.');
  const ext = dotIdx >= 0 ? fileName.slice(dotIdx) : '';
  const base = dotIdx >= 0 ? fileName.slice(0, dotIdx) : fileName;
  const parts = base.split('-');

  let tip = '', faza = '', vlo = '', ime = '', datum = '';

  if (parts.length >= 4) {
    tip = parts[0];
    faza = parts[1];
    vlo = parts[2];
    // Check if last part looks like a date (8 digits YYYYMMDD)
    const last = parts[parts.length - 1];
    if (/^\d{8}$/.test(last) && parts.length >= 5) {
      datum = `${last.slice(0, 4)}-${last.slice(4, 6)}-${last.slice(6, 8)}`;
      ime = parts.slice(3, parts.length - 1).join('-');
    } else {
      ime = parts.slice(3).join('-');
    }
  } else {
    // Doesn't match naming convention — put whole base as ime
    ime = base;
  }

  return { tip, faza, vlo, ime, datum, ext };
}

// ── Edit sub-modal ─────────────────────────────────────────────────────────────

function EditFileModal({ file, folders, projektId, fileAreaId, onSave, onClose }) {
  const parsed = parseFilenameToMeta(file.fileName);

  const [tip, setTip] = useState(parsed.tip);
  const [faza, setFaza] = useState(parsed.faza);
  const [vlo, setVlo] = useState(parsed.vlo);
  const [ime, setIme] = useState(parsed.ime);
  const [datum, setDatum] = useState(parsed.datum);
  const [folderPath, setFolderPath] = useState(
    folders.find(f => f.folderId === file.folderId)?.path || ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Live filename preview (same logic as generateNewFilename in fileHelpers.js)
  const previewName = useMemo(() => {
    const parts = [tip, faza, vlo, ime].filter(Boolean);
    if (datum) {
      const ds = datum.replace(/-/g, '');
      if (ds.length === 8) parts.push(ds);
    }
    return parts.length ? parts.join('-') + parsed.ext : '';
  }, [tip, faza, vlo, ime, datum, parsed.ext]);

  const fieldStyle = (val) =>
    !val ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white';

  const handleSave = async () => {
    if (!tip || !faza || !vlo || !ime.trim()) { setError('Izpolni vsa obvezna polja (TIP, FAZA, VLO, IME)'); return; }
    if (!previewName) { setError('Novo ime je prazno'); return; }
    const targetFolder = folders.find(f => f.path === folderPath);
    if (!targetFolder) { setError('Izberi veljavno mapo'); return; }
    const revisionId = file.latestRevisionId || file.latestFileRevisionId || file.fileRevisionId;
    if (!revisionId) { setError('Ne najdem revizije datoteke'); return; }

    setSaving(true);
    setError('');
    try {
      const client = new DaluxApiClient();
      await client.moveFile(projektId, fileAreaId, file.fileId, previewName, targetFolder.folderId, file.folderId, revisionId);
      onSave(previewName);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> Uredi metapodatke
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current filename */}
          <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
            <span className="font-medium">Trenutno:</span> {file.fileName}
          </div>

          {/* TIP, FAZA, VLO row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">TIP <span className="text-red-500">*</span></label>
              <select value={tip} onChange={e => setTip(e.target.value)}
                className={`w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${fieldStyle(tip)}`}>
                <option value="">Izberi...</option>
                {Object.entries(TIP_OPTIONS).map(([k, v]) => (
                  <option key={k} value={k}>{k} – {v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">FAZA <span className="text-red-500">*</span></label>
              <select value={faza} onChange={e => setFaza(e.target.value)}
                className={`w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${fieldStyle(faza)}`}>
                <option value="">Izberi...</option>
                {Object.entries(FAZA_OPTIONS).map(([k, v]) => (
                  <option key={k} value={k}>{k} – {v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">VLO <span className="text-red-500">*</span></label>
              <select value={vlo} onChange={e => setVlo(e.target.value)}
                className={`w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${fieldStyle(vlo)}`}>
                <option value="">Izberi...</option>
                {Object.entries(VLO_OPTIONS).map(([k, v]) => (
                  <option key={k} value={k}>{k} – {v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* IME */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">IME <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2">
              <input type="text" value={ime}
                onChange={e => setIme(e.target.value.replace(/[\s-]+/g, '_').slice(0, 100))}
                placeholder="Ime dokumenta"
                className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${fieldStyle(ime)}`}
              />
              {parsed.ext && <span className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-1.5 rounded">{parsed.ext}</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">Presledki in - se zamenjajo z _</p>
          </div>

          {/* DATUM */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">DATUM (opcijsko)</label>
            <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Folder */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Mapa</label>
            <FolderTreePicker folders={folders} value={folderPath} onChange={setFolderPath} />
          </div>

          {/* Preview */}
          {previewName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Predogled novega imena:
              </p>
              <code className="text-sm font-mono text-blue-900 break-all">{previewName}</code>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Shranjujem...</> : <><Save className="w-4 h-4" /> Shrani</>}
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition">
              Prekliči
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

const FileMetadataModal = ({ projektId, projektSifra, onClose }) => {
  const [fileAreas, setFileAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState('');
  const client = useMemo(() => new DaluxApiClient(), []);

  // Load file areas + folders on mount
  useEffect(() => {
    if (!projektId) return;
    (async () => {
      try {
        const areas = await client.getFileAreasById(projektId);
        setFileAreas(areas);
        if (areas.length > 0) {
          const areaId = areas[0].data.fileAreaId;
          setSelectedAreaId(areaId);
          const [foldersData] = await Promise.all([
            client.getFoldersByProjectId(projektId, areaId),
          ]);
          setFolders(foldersData);
        }
      } catch (e) {
        console.error('Failed to load areas/folders', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [projektId]);

  // Load files when file area changes
  useEffect(() => {
    if (!selectedAreaId || !projektId) return;
    setLoadingFiles(true);
    setFiles([]);
    client.getFiles(projektId, selectedAreaId)
      .then(items => setFiles(items))
      .catch(e => console.error('Failed to load files', e))
      .finally(() => setLoadingFiles(false));
  }, [selectedAreaId, projektId]);

  // Group files by folderId
  const filesByFolder = useMemo(() => {
    const map = {};
    files.forEach(item => {
      const fd = item.data || item;
      const fid = fd.folderId || '__root__';
      if (!map[fid]) map[fid] = [];
      map[fid].push(fd);
    });
    return map;
  }, [files]);

  const currentFiles = selectedFolderId ? (filesByFolder[selectedFolderId] || []) : [];
  const selectedFolder = folders.find(f => f.folderId === selectedFolderId);

  const handleAreaChange = async (areaId) => {
    setSelectedAreaId(areaId);
    setSelectedFolderId(null);
    setFolders([]);
    const foldersData = await client.getFoldersByProjectId(projektId, areaId);
    setFolders(foldersData);
  };

  const handleSaveSuccess = (newName) => {
    // Update file name in local state
    setFiles(prev => prev.map(item => {
      const fd = item.data || item;
      if (fd.fileId === editingFile.fileId) {
        return item.data ? { ...item, data: { ...fd, fileName: newName } } : { ...item, fileName: newName };
      }
      return item;
    }));
    setSaveSuccess(`Datoteka shranjena kot: ${newName}`);
    setEditingFile(null);
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Metapodatki Datotek
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Projekt: {projektSifra}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* File area selector */}
        {fileAreas.length > 1 && (
          <div className="px-5 py-3 border-b flex-shrink-0 flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">File Area:</label>
            <select
              value={selectedAreaId}
              onChange={e => handleAreaChange(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {fileAreas.map(a => (
                <option key={a.data.fileAreaId} value={a.data.fileAreaId}>
                  {a.data.fileAreaName} ({a.data.fileAreaType})
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-slate-600">Nalagam strukturo...</span>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - folder tree */}
            <div className="w-64 border-r flex-shrink-0 overflow-y-auto p-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-2 py-2">Mape</p>
              <SidebarTree
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelect={setSelectedFolderId}
              />
            </div>

            {/* Main panel - files */}
            <div className="flex-1 overflow-y-auto">
              {!selectedFolderId ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Folder className="w-16 h-16 mb-3 opacity-30" />
                  <p>Izberi mapo na levi</p>
                </div>
              ) : (
                <div className="p-5">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 mb-4">
                    <Folder className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-slate-800">{selectedFolder?.name || 'Mapa'}</h3>
                    <span className="text-sm text-slate-400">({currentFiles.length} datotek)</span>
                  </div>

                  {saveSuccess && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{saveSuccess}
                    </div>
                  )}

                  {loadingFiles ? (
                    <div className="flex items-center gap-2 text-slate-500 py-8">
                      <Loader2 className="w-5 h-5 animate-spin" /> Nalagam datoteke...
                    </div>
                  ) : currentFiles.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Mapa je prazna</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-slate-500 text-xs uppercase tracking-wide">
                            <th className="pb-2 font-medium">Ime datoteke</th>
                            <th className="pb-2 font-medium pl-4">Naloženo</th>
                            <th className="pb-2 font-medium pl-4">Zadnja sprememba</th>
                            <th className="pb-2 font-medium pl-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentFiles.map((fd, i) => (
                            <tr key={fd.fileId || i} className="border-b hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 text-slate-800 font-medium max-w-xs truncate">{fd.fileName}</td>
                              <td className="py-2.5 pl-4 text-slate-500 whitespace-nowrap">{fd.uploaded ? fd.uploaded.slice(0,10) : '—'}</td>
                              <td className="py-2.5 pl-4 text-slate-500 whitespace-nowrap">{fd.lastModified ? fd.lastModified.slice(0,10) : '—'}</td>
                              <td className="py-2.5 pl-4">
                                <button
                                  onClick={() => setEditingFile(fd)}
                                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
                                >
                                  <Edit3 className="w-3 h-3" /> Uredi metapodatke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit sub-modal */}
      {editingFile && (
        <EditFileModal
          file={editingFile}
          folders={folders}
          projektId={projektId}
          fileAreaId={selectedAreaId}
          onSave={handleSaveSuccess}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  );
};

export default FileMetadataModal;
