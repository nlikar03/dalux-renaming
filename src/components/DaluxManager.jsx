import { useEffect, useState } from 'react';
import { Play, Download, FileText, RefreshCw } from 'lucide-react';
import DaluxApiClient from '../api/daluxApi';

const DaluxManager = ({ onToolSelect }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const client = new DaluxApiClient();

  useEffect(() => {
    async function loadProjects() {
      try {
        const projectData = await client.getAllProjects();
        setProjects(projectData);
      } catch (err) {
        setError('Napaka pri pridobivanju projektov: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const handleStartTool = () => {
    if (!selectedProject || !selectedTool) return;
    const project = projects.find(p => p.projectId === selectedProject);
    if (project) {
      onToolSelect(selectedTool, project.number, project.projectId, project.projectName);
    }
  };

  const handleReset = () => {
    setSelectedProject('');
    setSelectedTool('');
    setError('');
  };

  const tools = [
    {
      id: 'rename',
      name: 'Preimenovanje Datotek',
      description: 'Preimenovanje in organizacija projektnih datotek',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'export',
      name: 'Dalux Export',
      description: 'Prenos datotek iz Dalux sistema (kmalu dostopno)',
      icon: Download,
      color: 'green',
      disabled: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-8 rounded-t-xl text-center">
          <h1 className="text-3xl font-bold">Dalux Manager</h1>
          <p className="text-slate-300 mt-2">Izberi orodje in projekt za začetek dela</p>
        </div>

        <div className="bg-white rounded-b-xl shadow-xl p-8">
          {loading && <p className="text-slate-600">Nalagam projekte...</p>}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="space-y-6">
              {/* Tool Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Izberi orodje:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tools.map((tool) => {
                    const Icon = tool.icon;
                    const isSelected = selectedTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => !tool.disabled && setSelectedTool(tool.id)}
                        disabled={tool.disabled}
                        className={`p-6 rounded-lg border-2 transition-all text-left ${
                          tool.disabled
                            ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                            : isSelected
                              ? tool.color === 'blue'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-green-500 bg-green-50'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${
                            tool.disabled
                              ? 'bg-slate-200 text-slate-400'
                              : isSelected
                                ? tool.color === 'blue'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-green-500 text-white'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold text-lg ${tool.disabled ? 'text-slate-400' : 'text-slate-800'}`}>
                              {tool.name}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Izberi projekt:
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="">Izberi projekt...</option>
                  {projects.map((p) => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.number} - {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleStartTool}
                  disabled={!selectedProject || !selectedTool}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Začni
                </button>

                <button
                  onClick={handleReset}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Ponastavi
                </button>
              </div>
            </div>
          )}

          {!loading && projects.length === 0 && !error && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
              Ni najdenih projektov. Preveri backend in poskusi ponovno.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DaluxManager;