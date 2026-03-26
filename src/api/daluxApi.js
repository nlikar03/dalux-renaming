// Updated daluxApi.js with date filtering support

import { getPassword, clearPassword } from '../utils/auth';

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default class DaluxApiClient {
  constructor(baseUrl = DEFAULT_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Thin fetch wrapper that:
   *  - injects X-App-Password on every request
   *  - on 401: clears the stored password and reloads so PasswordGate shows again
   */
  async _fetch(url, options = {}) {
    const headers = { "X-App-Password": getPassword(), ...(options.headers || {}) };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      clearPassword();
      window.location.reload();
      throw new Error("Unauthorized");
    }
    return res;
  }

  // ========== PROJECT & FILE AREA METHODS ==========

  async getAllProjects() {
    const res = await this._fetch(`${this.baseUrl}/projects`);
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
  }

  async getFileAreas(projectNumber) {
    const res = await this._fetch(`${this.baseUrl}/projects/${projectNumber}/file_areas`);
    if (!res.ok) throw new Error("Failed to fetch file areas");
    return res.json();
  }

  async getFolders(projectNumber, fileAreaId) {
    const res = await this._fetch(`${this.baseUrl}/projects/${projectNumber}/file_areas/${fileAreaId}/folders`);
    if (!res.ok) throw new Error("Failed to fetch folders");
    return res.json();
  }

  async getFileAreasById(projectId) {
    const res = await this._fetch(`${this.baseUrl}/projects/id/${projectId}/file_areas`);
    if (!res.ok) throw new Error("Failed to fetch file areas");
    return res.json();
  }

  async getFoldersByProjectId(projectId, fileAreaId) {
    const res = await this._fetch(`${this.baseUrl}/projects/id/${projectId}/file_areas/${fileAreaId}/folders`);
    if (!res.ok) throw new Error("Failed to fetch folders");
    return res.json();
  }

  async getFiles(projectId, fileAreaId) {
    const res = await this._fetch(`${this.baseUrl}/projects/id/${projectId}/file_areas/${fileAreaId}/files`);
    if (!res.ok) throw new Error("Failed to fetch files");
    return res.json();
  }

  async moveFile(projectId, fileAreaId, fileId, newName, newFolderId, currentFolderId, revisionId) {
    const res = await this._fetch(
      `${this.baseUrl}/projects/id/${projectId}/file_areas/${fileAreaId}/files/${fileId}/move`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: newName, new_folder_id: newFolderId, current_folder_id: currentFolderId, revision_id: revisionId }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Move failed: ${err}`);
    }
    return res.json();
  }

  // ========== DOWNLOAD METHODS WITH DATE RANGE FILTERING ==========

  async downloadFilesWithProgress(projectNumber, fileAreaId, startDate = null, endDate = null, dateField = "lastModified", onProgress = null) {
    const formData = new FormData();
    formData.append("project_number", projectNumber);
    formData.append("file_area_id", fileAreaId);
    
    if (startDate) {
      formData.append("start_date", startDate);
    }
    if (endDate) {
      formData.append("end_date", endDate);
    }
    formData.append("date_field", dateField);

    const res = await this._fetch(`${this.baseUrl}/download/files/stream`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Download failed: ${error}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let zipFilename = null;
    let downloadUrl = null;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (onProgress) {
              onProgress(data);
            }
            
            if (data.stage === 'complete') {
              zipFilename = data.filename;
              downloadUrl = data.download_path;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }

    if (!zipFilename || !downloadUrl) {
      throw new Error('No download URL received from server');
    }

    // Fetch the already-created ZIP via the GET endpoint (no re-processing)
    const downloadRes = await this._fetch(`${this.baseUrl}${downloadUrl}`);
    if (!downloadRes.ok) {
      throw new Error('Failed to fetch ZIP file');
    }

    const blob = await downloadRes.blob();
    return { blob, filename: zipFilename };
  }

  async downloadFiles(projectNumber, fileAreaId, startDate = null, endDate = null, dateField = "lastModified", onProgress = null) {
    const formData = new FormData();
    formData.append("project_number", projectNumber);
    formData.append("file_area_id", fileAreaId);
    
    if (startDate) {
      formData.append("start_date", startDate);
    }
    if (endDate) {
      formData.append("end_date", endDate);
    }
    formData.append("date_field", dateField);

    const res = await this._fetch(`${this.baseUrl}/download/files`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Download failed: ${error}`);
    }

    // Get filename from header
    const disposition = res.headers.get("content-disposition");
    const filenameMatch = disposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `${projectNumber}_files.zip`;

    // Download blob
    const blob = await res.blob();
    return { blob, filename };
  }

  async downloadForms(projectNumber, includeAttachments = false) {
    const formData = new FormData();
    formData.append("project_number", projectNumber);
    formData.append("include_attachments", includeAttachments.toString());

    const res = await this._fetch(`${this.baseUrl}/download/forms`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Download failed: ${error}`);
    }

    const disposition = res.headers.get("content-disposition");
    const filenameMatch = disposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `${projectNumber}_forms.json`;

    const blob = await res.blob();
    return { blob, filename };
  }

  async downloadTasks(projectNumber) {
    const formData = new FormData();
    formData.append("project_number", projectNumber);

    const res = await this._fetch(`${this.baseUrl}/download/tasks`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Download failed: ${error}`);
    }

    const disposition = res.headers.get("content-disposition");
    const filenameMatch = disposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `${projectNumber}_tasks.json`;

    const blob = await res.blob();
    return { blob, filename };
  }

  async downloadAll(
    projectNumber,
    fileAreaId,
    includeFiles = true,
    includeForms = true,
    includeTasks = true,
    includeFormAttachments = false,
    startDate = null,
    endDate = null,
    dateField = "lastModified"
  ) {
    const formData = new FormData();
    formData.append("project_number", projectNumber);
    formData.append("file_area_id", fileAreaId);
    formData.append("include_files", includeFiles.toString());
    formData.append("include_forms", includeForms.toString());
    formData.append("include_tasks", includeTasks.toString());
    formData.append("include_form_attachments", includeFormAttachments.toString());
    
    if (startDate) {
      formData.append("start_date", startDate);
    }
    if (endDate) {
      formData.append("end_date", endDate);
    }
    formData.append("date_field", dateField);

    const res = await this._fetch(`${this.baseUrl}/download/all`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Download failed: ${error}`);
    }

    const disposition = res.headers.get("content-disposition");
    const filenameMatch = disposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `${projectNumber}_dalux_data.zip`;

    const blob = await res.blob();
    return { blob, filename };
  }

  // ========== UPLOAD METHODS ==========

  async uploadFile(projectId, fileAreaId, folderPath, file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileAreaId", fileAreaId);
    formData.append("folderPath", folderPath);
    formData.append("projectId", projectId);

    const res = await this._fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  }

  async bulkUploadFromStructure(projectId, filesDict) {
    if (!filesDict || Object.keys(filesDict).length === 0) {
      throw new Error("No files to upload");
    }

    // projectId here is always the UUID (e.g. S425569471122376713)
    const fileAreas = await this.getFileAreasById(projectId);
    if (!fileAreas || fileAreas.length === 0) {
      throw new Error("No file areas found");
    }
    const fileAreaId = fileAreas[0].data.fileAreaId;

    const allResults = { success: 0, failed: 0, details: [] };

    for (const [folder, filesList] of Object.entries(filesDict)) {
      if (!filesList || filesList.length === 0) continue;

      for (const [filename, content] of filesList) {
        try {
          // Step 1: create upload slot (backend calls Dalux, returns guid)
          const slotForm = new FormData();
          slotForm.append("projectId", projectId);   // UUID — no ambiguous name lookup
          slotForm.append("fileAreaId", fileAreaId);
          slotForm.append("folderPath", folder);
          slotForm.append("fileName", filename);

          const slotRes = await this._fetch(`${this.baseUrl}/upload_slot`, {
            method: "POST",
            body: slotForm,
          });
          if (!slotRes.ok) throw new Error(`Slot error: ${await slotRes.text()}`);
          const slot = await slotRes.json();

          // Step 2: stream file through backend proxy to Dalux (no buffering in RAM)
          const blob = content instanceof Blob ? content : new Blob([content]);
          const uploadForm = new FormData();
          uploadForm.append("projectId", projectId);
          uploadForm.append("fileAreaId", fileAreaId);
          uploadForm.append("file", blob, filename);

          const uploadRes = await this._fetch(`${this.baseUrl}/upload_proxy/${slot.upload_guid}`, {
            method: "POST",
            body: uploadForm,
          });
          if (!uploadRes.ok) throw new Error(`Upload error: ${await uploadRes.text()}`);

          // Step 3: finalize (use project_id + folder_id from slot — no re-lookup)
          const finalRes = await this._fetch(`${this.baseUrl}/finalize_upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project_id:  slot.project_id,
              fileAreaId,
              folder_id:   slot.folder_id,
              upload_guid: slot.upload_guid,
              fileName:    filename,
            }),
          });
          if (!finalRes.ok) throw new Error(`Finalize error: ${await finalRes.text()}`);

          allResults.success++;
          allResults.details.push({ file: filename, folder, status: "success" });

        } catch (error) {
          allResults.failed++;
          allResults.details.push({ file: filename, folder, status: "failed", error: error.message });
        }
      }
    }

    return allResults;
  }

  // ========== HELPER METHODS ==========

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}