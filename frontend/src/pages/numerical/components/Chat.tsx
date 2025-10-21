import { useState, useRef, type ChangeEvent } from "react";

interface PredictResponse {
  sentiment: string;
  score: number;
}

const Chat: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"num" | "nnum">("num");

  // Common states per tab
  const [numText, setNumText] = useState("");
  const [numFileContent, setNumFileContent] = useState("");
  const [numFileName, setNumFileName] = useState("");

  const [nnumText, setNnumText] = useState("");
  const [nnumFileContent, setNnumFileContent] = useState("");
  const [nnumFileName, setNnumFileName] = useState("");

  const [result, setResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const numFileRef = useRef<HTMLInputElement | null>(null);
  const nnumFileRef = useRef<HTMLInputElement | null>(null);

  // Analyze text or file content
  const analyze = async () => {
    const isNum = activeTab === "num";
    const inputText = isNum
      ? numText.trim() || numFileContent
      : nnumText.trim() || nnumFileContent;

    if (!inputText) {
      setResult("Please enter some text or upload a file to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setResult("");

    try {
      const apiUrl = isNum
        ? "http://localhost:5001/api/predict"
        : "http://localhost:5001/api/predictate";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data: PredictResponse = await res.json();
      setResult(`${data.sentiment} (${data.score.toFixed(2)})`);
    } catch (error) {
      console.error("Error:", error);
      setResult("Error: Failed to analyze text. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (
    event: ChangeEvent<HTMLInputElement>,
    type: "num" | "nnum"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("text/") && !file.name.endsWith(".txt")) {
      setResult("Error: Please upload a text file (.txt)");
      return;
    }

    if (file.size > 1024 * 1024) {
      setResult("Error: File size must be less than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;

      if (type === "num") {
        setNumFileContent(content);
        setNumFileName(file.name);
        setNumText("");
      } else {
        setNnumFileContent(content);
        setNnumFileName(file.name);
        setNnumText("");
      }

      setResult("File loaded successfully! Click 'Analyze' to get sentiment.");
    };
    reader.onerror = () => setResult("Error: Failed to read file");
    reader.readAsText(file);
  };

  // Clear all inputs
  const clearAll = () => {
    if (activeTab === "num") {
      setNumText("");
      setNumFileContent("");
      setNumFileName("");
      if (numFileRef.current) numFileRef.current.value = "";
    } else {
      setNnumText("");
      setNnumFileContent("");
      setNnumFileName("");
      if (nnumFileRef.current) nnumFileRef.current.value = "";
    }
    setResult("");
  };

  const isError = result.toLowerCase().includes("error");

  // Helper for rendering tab content
  const renderTabContent = (type: "num" | "nnum") => {
    const text = type === "num" ? numText : nnumText;
    const fileName = type === "num" ? numFileName : nnumFileName;
    const setText = type === "num" ? setNumText : setNnumText;
    const fileRef = type === "num" ? numFileRef : nnumFileRef;

    return (
      <>
        {/* File Upload */}
        <div className="mb-4 p-4 border-2 border-dashed rounded bg-white text-center">
          <h3 className="font-medium mb-2">Upload Text File</h3>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,text/*"
            onChange={(e) => handleFileUpload(e, type)}
            className="border rounded px-2 py-1 w-full"
          />
          {fileName && <p className="text-green-600 mt-1">📁 {fileName}</p>}
        </div>

        {/* Manual Text Input */}
        <div className="mb-4 flex-1 flex flex-col">
          <h3 className="font-medium mb-1">Or Enter Text Manually</h3>
          <textarea
            maxLength={1000}
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to analyze or upload a file above..."
            className="w-full flex-1 border-2 border-gray-300 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Character count: {text.length} / 1000
          </p>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-auto bg-gray-50 text-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
        Sentiment Analyzer
      </h1>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded font-semibold ${
            activeTab === "num"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("num")}
        >
          Num
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${
            activeTab === "nnum"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("nnum")}
        >
          Nnum
        </button>
      </div>

      {/* Active Tab Content */}
      {renderTabContent(activeTab)}

      {/* Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={analyze}
          disabled={
            isAnalyzing ||
            (!numText.trim() && !numFileContent && activeTab === "num") ||
            (!nnumText.trim() && !nnumFileContent && activeTab === "nnum")
          }
          className={`flex-1 py-2 rounded font-semibold text-white ${
            isAnalyzing ||
            (!numText.trim() && !numFileContent && activeTab === "num") ||
            (!nnumText.trim() && !nnumFileContent && activeTab === "nnum")
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
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
      {result && (
        <div
          className={`p-3 rounded font-bold mb-4 text-center ${
            isError
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-green-100 text-green-700 border border-green-300"
          }`}
        >
          {result}
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-gray-100 rounded text-gray-700 text-sm">
        <h4 className="font-medium mb-1">📋 How to Use:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Select Tab:</strong> Choose between <code>Num</code> or{" "}
            <code>Nnum</code> for different APIs.
          </li>
          <li>
            <strong>Upload a file:</strong> Click "Choose File" and select a
            .txt file.
          </li>
          <li>
            <strong>Manual input:</strong> Type or paste text in the textarea.
          </li>
          <li>
            <strong>Analyze:</strong> Click "Analyze" to get the sentiment
            score.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Chat;
