import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';

function buildTree(folders) {
  const map = {};
  const roots = [];
  (folders || []).forEach(f => { map[f.folderId] = { ...f, children: [] }; });
  (folders || []).forEach(f => {
    if (f.parentId && map[f.parentId]) {
      map[f.parentId].children.push(map[f.folderId]);
    } else {
      roots.push(map[f.folderId]);
    }
  });
  const sort = nodes => { nodes.sort((a,b) => a.name.localeCompare(b.name)); nodes.forEach(n => sort(n.children)); return nodes; };
  return sort(roots);
}

function TreeNode({ node, depth, selectedPath, expanded, onToggle, onSelect }) {
  const isExpanded = expanded.has(node.folderId);
  const isSelected = selectedPath === node.path;
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1.5 cursor-pointer rounded-md transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-700'}`}
        style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: '8px' }}
      >
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0"
          onClick={e => { e.stopPropagation(); hasChildren && onToggle(node.folderId); }}>
          {hasChildren ? (isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />) : null}
        </span>
        <span className="flex items-center gap-1.5 text-sm flex-1" onClick={() => onSelect(node.path)}>
          {isExpanded && hasChildren ? <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" /> : <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
          {node.name}
        </span>
      </div>
      {isExpanded && hasChildren && node.children.map(child => (
        <TreeNode key={child.folderId} node={child} depth={depth+1} selectedPath={selectedPath} expanded={expanded} onToggle={onToggle} onSelect={onSelect} />
      ))}
    </div>
  );
}

const FolderTreePicker = ({ folders, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const ref = useRef(null);
  const tree = buildTree(folders);
  const selectedFolder = (folders || []).find(f => f.path === value);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleToggle = id => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleSelect = path => { onChange(path); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-4 py-2 border rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500 outline-none transition text-sm ${!value ? 'bg-rose-50 border-rose-200 text-slate-400' : 'bg-white border-slate-300 text-slate-800'}`}
      >
        <span className="flex items-center gap-2 truncate">
          {value && <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
          {selectedFolder?.name || value || 'Izberi mapo...'}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl">
          <div className="border-b px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Izberi mapo</span>
            {value && <button type="button" onClick={() => { handleSelect(''); }} className="text-xs text-red-500 hover:text-red-700">Počisti</button>}
          </div>
          <div className="max-h-64 overflow-y-auto py-1 px-1">
            {tree.map(node => (
              <TreeNode key={node.folderId} node={node} depth={0} selectedPath={value} expanded={expanded} onToggle={handleToggle} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderTreePicker;
