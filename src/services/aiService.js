// src/services/aiService.js

import { getPassword, clearPassword } from '../utils/auth';

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const analyzeFileWithAI = async (filename, tipOptions, fazaOptions, vloOptions, folderPaths) => {
  try {
    const response = await fetch(`${BACKEND_URL}/ai/analyze_file`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Password": getPassword(),
      },
      body: JSON.stringify({
        filename: filename,
        tip_options: tipOptions,
        faza_options: fazaOptions,
        vlo_options: vloOptions,
        folder_paths: folderPaths
      })
    });

    if (response.status === 401) {
      clearPassword();
      window.location.reload();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error("AI analysis failed");
    }

    return result;

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};