import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

const FileUploader = ({ onFilesAdded }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const added = await onFilesAdded(files);
      if (added > 0) {
        // Reset input to allow uploading same file again
        e.target.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await onFilesAdded(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        1. Naloži datoteke
      </h2>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
      >
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium mb-2">
          Klikni za izbiro ali povleci datoteke sem
        </p>
        <p className="text-sm text-slate-500">
          Podprte so vse vrste datotek
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 Izbereš lahko več datotek hkrati
        </p>
      </div>
    </div>
  );
};

export default FileUploader;