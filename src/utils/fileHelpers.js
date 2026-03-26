export const generateNewFilename = (fileData, projektSifra) => {
  const parts = [
    fileData.tip || '',
    fileData.faza || '',
    fileData.vlo || '',
    fileData.ime || ''
  ];

  if (fileData.datum) {
    try {
      // Validate and format date
      const dateStr = fileData.datum.replace(/-/g, '');
      if (dateStr.length === 8) {
        parts.push(dateStr);
      }
    } catch (e) {
      console.error('Invalid date format:', e);
    }
  }

  const filteredParts = parts.filter(p => p);
  if (!filteredParts.length) return '';

  const ext = fileData.extension || '';
  return `${filteredParts.join('-')}${ext ? '.' + ext : ''}`;
};


export const isFileComplete = (fileData) => {
  return !!(
    fileData.tip &&
    fileData.faza &&
    fileData.vlo &&
    fileData.ime &&
    fileData.target_subfolder
  );
};


export const getFileExtension = (filename) => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
};


export const getFilenameWithoutExtension = (filename) => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    parts.pop();
  }
  return parts.join('.');
};


export const sanitizeFilename = (name) => {
  return name.replace(/[\s-]+/g, '_').substring(0, 100);
};


export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};


export const createFileObject = async (uploadedFile) => {
  const content = await readFileAsArrayBuffer(uploadedFile);
  const extension = getFileExtension(uploadedFile.name);
  const nameWithoutExt = getFilenameWithoutExtension(uploadedFile.name);

  return {
    original_name: uploadedFile.name,
    content: content,
    extension: extension,
    tip: '',
    faza: '',
    vlo: '',
    ime: sanitizeFilename(nameWithoutExt),
    datum: '',
    target_subfolder: ''
  };
};