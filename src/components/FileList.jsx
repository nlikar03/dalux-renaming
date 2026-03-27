// src/components/FileList.jsx

import { FileText, ChevronLeft, ChevronRight, X, CheckCircle, Clock } from 'lucide-react';
import { isFileComplete } from '../utils/fileHelpers';

const FileList = ({
  files,
  currentIndex,
  currentPage,
  onSelectFile,
  onDeleteFile,
  onPageChange,
  selectedIndices,
  onToggleSelect,
  onSelectAllPage,
}) => {
  const filesPerPage = 10;
  const totalPages = Math.ceil(files.length / filesPerPage);
  const startIdx = currentPage * filesPerPage;
  const endIdx = Math.min(startIdx + filesPerPage, files.length);
  const currentFiles = files.slice(startIdx, endIdx);
  const pageIndices = Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i);

  const allPageSelected = pageIndices.length > 0 && pageIndices.every(i => selectedIndices.has(i));
  const somePageSelected = pageIndices.some(i => selectedIndices.has(i));

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Seznam datotek
        </h3>
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p>Ni naloženih datotek</p>
          <p className="text-sm mt-1">Naloži datoteke za začetek</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Seznam datotek ({files.length})
          {selectedIndices.size > 0 && (
            <span className="ml-2 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {selectedIndices.size} izbranih
            </span>
          )}
        </h3>
        {/* Select-all checkbox for current page */}
        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allPageSelected}
            ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
            onChange={() => onSelectAllPage(pageIndices, !allPageSelected)}
            className="w-4 h-4 rounded accent-blue-600"
          />
          Stran
        </label>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-2 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-slate-600">
            Stran {currentPage + 1} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* File List */}
      <div className="space-y-2">
        {currentFiles.map((file, localIdx) => {
          const actualIdx = startIdx + localIdx;
          const complete = isFileComplete(file);
          const isSelected = actualIdx === currentIndex;
          const isChecked = selectedIndices.has(actualIdx);

          return (
            <div
              key={actualIdx}
              data-selected={isSelected}
              className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : isChecked
                  ? 'border-blue-300 bg-blue-50/50'
                  : complete
                  ? 'border-green-200 bg-green-50 hover:bg-green-100'
                  : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleSelect(actualIdx)}
                onClick={e => e.stopPropagation()}
                className="w-4 h-4 flex-shrink-0 rounded accent-blue-600"
              />

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {complete ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600" />
                )}
              </div>

              {/* File Name */}
              <button
                onClick={() => onSelectFile(actualIdx)}
                className="flex-1 text-left text-sm font-medium text-slate-700 hover:text-blue-600 transition truncate"
              >
                {file.original_name}
              </button>

              {/* Delete Button */}
              <button
                onClick={() => onDeleteFile(actualIdx)}
                className="flex-shrink-0 p-1.5 rounded hover:bg-red-100 text-red-600 transition"
                title="Odstrani datoteko"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="mt-4 pt-3 border-t text-sm text-slate-600">
        Prikazujem {startIdx + 1}-{endIdx} od {files.length} datotek
      </div>
    </div>
  );
};

export default FileList;
