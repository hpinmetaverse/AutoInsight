import { useState, useRef, type ChangeEvent } from "react";

interface PredictResponse {
  sentiment: string;
  score: number; 
}

type TabType = 'num' | 'nnum';

interface TabState {
  text: string;
  fileContent: string;
  fileName: string;
  result: string;
}

const Chat: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('num');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Separate state for each tab
  const [tabStates, setTabStates] = useState<Record<TabType, TabState>>({
    num: {
      text: "",
      fileContent: "",
      fileName: "",
      result: ""
    },
    nnum: {
      text: "",
      fileContent: "",
      fileName: "",
      result: ""
    }
  });

  const fileInputRefs = {
    num: useRef<HTMLInputElement | null>(null),
    nnum: useRef<HTMLInputElement | null>(null)
  };

  // Get current tab state
  const currentState = tabStates[activeTab];

  // Update current tab state
  const updateCurrentTabState = (updates: Partial<TabState>) => {
    setTabStates(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...updates }
    }));
  };

  // Analyze text or file content
  const analyze = async () => {
    const inputText = currentState.text.trim() ? currentState.text : currentState.fileContent;

    if (!inputText) {
      updateCurrentTabState({ result: "Please enter some text or upload a file to analyze." });
      return;
    }

    setIsAnalyzing(true);
    updateCurrentTabState({ result: "" });

    try {
      // Use different API based on active tab
      const apiUrl = activeTab === 'num' 
        ? "http://localhost:5001/api/predict"
        : "http://localhost:5001/api/predictate";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data: PredictResponse = await res.json();
      updateCurrentTabState({ result: `${data.sentiment} (${data.score.toFixed(2)})` });
    } catch (error) {
      console.error("Error:", error);
      updateCurrentTabState({ result: "Error: Failed to analyze text. Please try again." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle file upload for current tab
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    updateCurrentTabState({ 
      fileName: file.name,
      text: "" // Clear manual text if a file is uploaded
    });

    if (!file.type.startsWith("text/") && !file.name.endsWith(".txt")) {
      updateCurrentTabState({ result: "Error: Please upload a text file (.txt)" });
      return;
    }

    if (file.size > 1024 * 1024) {
      updateCurrentTabState({ result: "Error: File size must be less than 1MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      updateCurrentTabState({ 
        fileContent: e.target.result as string,
        result: "File loaded successfully! Click 'Analyze' to get sentiment."
      });
    };
    reader.onerror = () => {
      updateCurrentTabState({ result: "Error: Failed to read file" });
    };
    reader.readAsText(file);
  };

  // Clear all inputs and results for current tab
  const clearAll = () => {
    updateCurrentTabState({
      text: "",
      fileContent: "",
      fileName: "",
      result: ""
    });
    if (fileInputRefs[activeTab].current) {
      fileInputRefs[activeTab].current.value = "";
    }
  };

  const isError = currentState.result.toLowerCase().includes("error");

  return (
    <div className="flex flex-col h-full p-4 overflow-auto bg-gray-50 text-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
        Sentiment Analyzer
      </h1>

      {/* Tab Navigation */}
      <div className="flex mb-4 border-b border-gray-300">
        <button
          className={`flex-1 py-2 font-semibold rounded-tl ${
            activeTab === 'num' 
              ? 'bg-blue-600 text-white border-b-2 border-blue-600' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('num')}
        >
          Num API
        </button>
        <button
          className={`flex-1 py-2 font-semibold rounded-tr ${
            activeTab === 'nnum' 
              ? 'bg-green-600 text-white border-b-2 border-green-600' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('nnum')}
        >
          Nnum API
        </button>
      </div>

      {/* API Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700">
          <strong>Current API:</strong>{' '}
          {activeTab === 'num' 
            ? 'http://localhost:5001/api/predict'
            : 'http://localhost:5001/api/predictate'
          }
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-4 p-4 border-2 border-dashed rounded bg-white text-center">
        <h3 className="font-medium mb-2">Upload Text File</h3>
        <input
          ref={fileInputRefs[activeTab]}
          type="file"
          accept=".txt,text/*"
          onChange={handleFileUpload}
          className="border rounded px-2 py-1 w-full"
        />
        {currentState.fileName && (
          <p className="text-green-600 mt-1">📁 {currentState.fileName}</p>
        )}
      </div>

      {/* Manual Text Input */}
      <div className="mb-4 flex-1 flex flex-col">
        <h3 className="font-medium mb-1">Or Enter Text Manually</h3>
        <textarea
          maxLength={1000}
          rows={6}
          value={currentState.text}
          onChange={(e) => updateCurrentTabState({ text: e.target.value })}
          placeholder="Enter text to analyze or upload a file above..."
          className="w-full flex-1 border-2 border-gray-300 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Character count: {currentState.text.length} / 1000
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={analyze}
          disabled={isAnalyzing || (!currentState.text.trim() && !currentState.fileContent)}
          className={`flex-1 py-2 rounded font-semibold text-white ${
            isAnalyzing || (!currentState.text.trim() && !currentState.fileContent)
              ? "bg-gray-400 cursor-not-allowed"
              : activeTab === 'num' 
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isAnalyzing ? "🔄 Analyzing..." : "🔍 Analyze"}
        </button>
        <button
          onClick={clearAll}
          className="py-2 px-4 rounded font-semibold text-white bg-gray-600 hover:bg-gray-700"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Result */}
      {currentState.result && (
        <div
          className={`p-3 rounded font-bold mb-4 text-center ${
            isError
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-green-100 text-green-700 border border-green-300"
          }`}
        >
          {currentState.result}
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-gray-100 rounded text-gray-700 text-sm">
        <h4 className="font-medium mb-1">📋 How to Use:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Select API:</strong> Choose between Num and Nnum APIs using the tabs
          </li>
          <li>
            <strong>Upload a file:</strong> Click "Choose File" and select a .txt file
          </li>
          <li>
            <strong>Manual input:</strong> Type or paste text in the textarea
          </li>
          <li>
            <strong>Analyze:</strong> Click "Analyze" to get the sentiment score
          </li>
          <li>
            <strong>Supported files:</strong> .txt files only, max 1MB
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Chat;