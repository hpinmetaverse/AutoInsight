import { useState, useRef, type ChangeEvent } from "react";

interface PredictResponse {
  sentiment: string;
  score: number; 
}

const Chat: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Analyze text or file content
  const analyze = async () => {
    const inputText = text.trim() ? text : fileContent;

    if (!inputText) {
      setResult("Please enter some text or upload a file to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setResult("");

    try {
      const res = await fetch("http://localhost:5001/api/predict", {
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
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setText(""); // Clear manual text if a file is uploaded

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
      setFileContent(e.target.result as string);
      setResult("File loaded successfully! Click 'Analyze' to get sentiment.");
    };
    reader.onerror = () => {
      setResult("Error: Failed to read file");
    };
    reader.readAsText(file);
  };

  // Clear all inputs and results
  const clearAll = () => {
    setText("");
    setFileContent("");
    setFileName("");
    setResult("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isError = result.toLowerCase().includes("error");

  return (
    <div className="flex flex-col h-full p-4 overflow-auto bg-gray-50 text-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
        Sentiment Analyzer
      </h1>

      {/* File Upload */}
      <div className="mb-4 p-4 border-2 border-dashed rounded bg-white text-center">
        <h3 className="font-medium mb-2">Upload Text File</h3>
        <input
          ref={fileInputRef}
          id="fileInput"
          type="file"
          accept=".txt,text/*"
          onChange={handleFileUpload}
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

      {/* Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={analyze}
          disabled={isAnalyzing || (!text.trim() && !fileContent)}
          className={`flex-1 py-2 rounded font-semibold text-white ${
            isAnalyzing || (!text.trim() && !fileContent)
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
            <strong>Upload a file:</strong> Click "Choose File" and select a
            .txt file
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
