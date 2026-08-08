import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api.js";

const FILE_ICONS = {
  js: "🟨", jsx: "️🟦", ts: "️💙", tsx: "️🤍", py: "🐍", go: "🐹", rs: "🦀",
  json: "{} ", md: "📝", txt: "📄", css: "🎨", html: "🔖", yml: "⚙️",
  toml: "⚙️", lock: "🔒",
};

export default function IdePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [tree, setTree] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [activeFile, setActiveFile] = useState("");
  const [terminal, setTerminal] = useState([]);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState("terminal");
  const editorRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/workspaces/${id}`)
      .then(({ data }) => setWorkspace(data))
      .catch(() => setError("Workspace not found"));
    api.get(`/ide/workspace/${id}/files`)
      .then(({ data }) => {
        setTree(data.tree);
        setWorkspace(data);
      })
      .catch(() => setError("Failed to load workspace files"))
      .finally(() => setLoading(false));
  }, [id]);

  const loadFile = async (filePath) => {
    if (!filePath) return;
    setActiveFile(filePath);
    try {
      const { data } = await api.get(`/ide/workspace/${id}/file?path=${encodeURIComponent(filePath)}`);
      setFileContent(data.content || "");
    } catch (err) {
      setFileContent("// File not found or binary content");
    }
  };

  const saveFile = async () => {
    if (!activeFile) return;
    try {
      await api.post(`/ide/workspace/${id}/file`, { filePath: activeFile, content: fileContent });
      addTerminalOutput(`Saved: ${activeFile}`);
    } catch (err) {
      addTerminalOutput(`Error saving file: ${err.response?.data?.error || err.message}`);
    }
  };

  const runCommand = async (command) => {
    addTerminalOutput(`$ ${command}`);
    try {
      const { data } = await api.post(`/ide/workspace/${id}/run`, { command });
      data.output.forEach((line) => addTerminalOutput(line));
    } catch (err) {
      addTerminalOutput(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const addTerminalOutput = (line) => {
    setTerminal((prev) => [...prev, line]);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.scrollTop = editorRef.current.scrollHeight;
      }
    }, 50);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    setChat((prev) => [...prev, userMsg]);
    setChatInput("");
    try {
      const { data } = await api.post(`/ide/workspace/${id}/chat`, { message: chatInput });
      setChat((prev) => [...prev, data.reply]);
    } catch (err) {
      setChat((prev) => [...prev, { role: "agent", content: "Error: " + (err.response?.data?.error || err.message) }]);
    }
  };

  const getFileExtension = (name) => {
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  };

  const [expandedDirs, setExpandedDirs] = useState(new Set());

  const toggleDir = (dirPath) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  };

  const renderTree = (node, depth = 0) => {
    const isDir = node.type === "dir";
    const hasChildren = isDir && node.children && node.children.length > 0;
    const icon = isDir ? "📁" : (FILE_ICONS[getFileExtension(node.name)] || "📄");
    const isSelected = activeFile === node.path;
    const isChildOfActive = activeFile && activeFile.startsWith(node.path + "/");
    const isExpanded = expandedDirs.has(node.path);

    return (
      <div key={node.path || "root"}>
        <div
          className={`flex items-center py-1 cursor-pointer transition-colors ${
            isSelected ? "bg-sky-900/30 text-sky-200 font-medium" : isChildOfActive ? "bg-sky-900/10 text-sky-300" : "text-gray-400 hover:bg-gray-800/30"
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => {
            if (isDir) {
              toggleDir(node.path);
            } else {
              loadFile(node.path);
            }
          }}
        >
          {isDir ? (
            <span className="mr-1">{isExpanded ? "📂" : icon}</span>
          ) : (
            <span className="mr-1">{icon}</span>
          )}
          <span className="truncate">{node.name}</span>
          {isDir && hasChildren && (
            <span className="ml-auto text-xs text-gray-400">({node.children.length})</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="overflow-hidden">
            {node.children.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getLanguageClass = (ext) => {
    const map = { js: "lang-js", jsx: "lang-jsx", ts: "lang-ts", tsx: "lang-tsx", py: "lang-python", go: "lang-go", rs: "lang-rust", json: "lang-json", css: "lang-css", html: "lang-html", md: "lang-markdown" };
    return map[ext] || "lang-text";
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading IDE...</div>;
  if (error) return <div className="bg-red-900/40 text-red-300 p-4 rounded-lg">{error}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">ALP IDE</h1>
          <p className="text-sm text-gray-400">Workspace: {workspace?.name || id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveFile}
            disabled={!activeFile}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            title="Save file"
          >
            💾 Save
          </button>
          <button
            onClick={() => runCommand("alp run")}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            title="Run ALP agent"
          >
            ▶ Run
          </button>
          <button
            onClick={() => runCommand("alp test")}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            title="Run tests"
          >
            🧪 Test
          </button>
          <button
            onClick={() => runCommand("alp deploy")}
            className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
            title="Deploy workspace"
          >
            🚀 Deploy
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden border border-gray-700 rounded-lg glass-dark">
        <div className="w-64 border-r border-gray-700 overflow-y-auto">
          <div className="bg-gray-800/50 px-3 py-2 text-xs font-medium text-gray-400 uppercase">
            Explorer
          </div>
          <div className="py-1 overflow-y-auto">
            {tree ? renderTree(tree, 0, new Set()) : <div className="py-4 text-center text-gray-500">Loading...</div>}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="border-b border-gray-700 bg-gray-800/30 px-3 py-2 flex items-center justify-between">
            <span className="text-sm text-gray-400 font-mono truncate">
              {activeFile || "No file selected"}
            </span>
            <span className="text-xs text-gray-500">
              {workspace?.alpVersion && `ALP v${workspace.alpVersion}`}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <textarea
                ref={editorRef}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className={`w-full h-full p-4 font-mono text-sm border-none outline-none resize-none bg-gray-900/40 text-gray-300 ${getLanguageClass(getFileExtension(activeFile))}`}
                spellCheck={false}
                style={{ tabSize: 2, fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace" }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a file to begin editing
              </div>
            )}
          </div>
        </div>

        <div className="w-80 flex flex-col border-l border-gray-700">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setPanel("terminal")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${panel === "terminal" ? "bg-gray-800/50 border-b-2 border-sky-500 text-sky-300" : "text-gray-400 hover:text-gray-300"}`}
            >
              Terminal
            </button>
            <button
              onClick={() => setPanel("chat")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${panel === "chat" ? "bg-gray-800/50 border-b-2 border-sky-500 text-sky-300" : "text-gray-400 hover:text-gray-300"}`}
            >
              ALP Agent
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {panel === "terminal" ? (
              <div
                ref={editorRef}
                className="font-mono text-xs p-3 bg-gray-900 text-gray-300 h-full overflow-y-auto"
              >
                {terminal.length === 0 ? (
                  <div className="text-gray-500">Terminal is ready. Click "Run" to execute commands.</div>
                ) : (
                  terminal.map((line, i) => (
                    <div key={i} className={line.startsWith("$") ? "text-sky-400" : "text-gray-400"}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {chat.length === 0 ? (
                  <div className="text-gray-500 text-sm">Ask the ALP agent about your code. Try "Explain this workspace" or "Find bugs".</div>
                ) : (
                  chat.map((msg, i) => (
                    <div key={i}>
                      <div className={`text-xs font-medium mb-1 ${msg.role === "user" ? "text-sky-400" : "text-purple-400"}`}>
                        {msg.role === "user" ? "You" : "ALP Agent"}
                      </div>
                      <div className={`p-2 rounded text-sm ${msg.role === "user" ? "bg-sky-900/30 text-sky-200" : "bg-purple-900/30 text-purple-200"}`}>
                        {msg.content}
                      </div>
                      {msg.suggestions && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {msg.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => setChatInput(s)}
                              className="text-xs px-2 py-0.5 bg-gray-700/40 text-gray-300 rounded hover:bg-gray-700"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="border-t border-gray-700 p-2">
            {panel === "terminal" ? (
              <input
                type="text"
                placeholder="Type a command..."
                onKeyDown={(e) => { if (e.key === "Enter") runCommand(e.target.value); e.target.value = ""; }}
                className="w-full px-2 py-1 text-sm border border-gray-600 rounded bg-gray-800/40 text-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask the ALP agent..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-600 rounded bg-gray-800/40 text-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                  className="px-3 py-1 bg-sky-600 text-white rounded text-sm hover:bg-sky-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
