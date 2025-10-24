import { useRef, useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { ArrowUpIcon, FileText, X, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";




const Chat = () => {
  const [mode, setMode] = useState<"Num" | "Non-Num">("Num");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select only CSV or Excel files");
      e.target.value = "";
      return;
    }

    // Simulate file upload
    setIsUploading(true);
    setTimeout(() => {
      setFilePreview(file.name);
      setIsUploading(false);
    }, 1000);
  };

  const removeFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePreview && !message.trim()) return;
    
    if (filePreview) {
      alert(`Sending file: ${filePreview} with message: ${message}`);
    } else {
      alert(`Sending message: ${message}`);
    }
    
    setMessage("");
    removeFile();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const getModeColor = (mode: string) => {
    return mode === "Num" ? " bg-gradient-to-b from-zinc-500 to-zinc-700 text-gray-300 " : " bg-gradient-to-b from-zinc-500 to-zinc-700 text-gray-300 ";
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
      <div className="w-full max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-800 to-green-300 bg-clip-text text-transparent mb-2">
          AutoInsight
          </h1>
          <p className="text-gray-400 text-sm">
            Upload CSV/Excel files and analyze your data with AI
          </p>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {/* File Preview */}
          {filePreview && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">{filePreview}</p>
                  <p className="text-xs text-white">Ready to analyze</p>
                </div>
              </div>
              <button
                type="button"
                className="p-1  rounded-full transition-colors"
                onClick={removeFile}
              >
                <X className="w-4 h-4 text-gray-200" />
              </button>
            </div>
          )}

          {/* Uploading State */}
          {isUploading && (
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Uploading file...</p>
                  <p className="text-xs text-gray-500">Please wait</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <InputGroup>
              <InputGroupTextarea
                placeholder={filePreview ? "Ask questions about your data..." : "Ask, search, or upload a file to analyze..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[80px] resize-none border-0 focus:ring-0 text-sm"
              />

              <InputGroupAddon align="block-end" className="px-3 pb-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {/* File Upload */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InputGroupButton
                            variant="outline"
                            className="rounded-full relative hover:bg-blue-50 hover:border-blue-200 transition-colors"
                            size="icon-xs"
                            type="button"
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <IconPlus className="w-4 h-4" />
                            )}
                            <input
                              type="file"
                              accept=".csv, .xls, .xlsx"
                              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              disabled={isUploading}
                            />
                          </InputGroupButton>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upload CSV or Excel file</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Mode Selector */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <InputGroupButton 
                          variant="ghost" 
                          className={`px-3 py-1 border text-xs font-medium transition-colors ${getModeColor(mode)}`}
                        >
                          {mode}
                        </InputGroupButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="top" align="start" className="w-32  bg-gradient-to-b from-zinc-800 to-zinc-900">
                        <DropdownMenuItem
                          onClick={() => setMode("Num")}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div className="w-2 h-2  " />

                          Num
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setMode("Non-Num")}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div className="w-2 h-2  " />
                          Non-Num
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Character count */}
                    {message.length > 0 && (
                      <span className="text-xs text-gray-500 px-2">
                        {message.length}/1000
                      </span>
                    )}
                    
                    <Separator orientation="vertical" className="!h-4" />

                    {/* Send button */}
                    <Button
                      type="submit"
                      size="sm"
                      className="rounded-full px-3 hover:shadow-md transition-all duration-200 cursor-pointer" 
                      disabled={(!filePreview && !message.trim()) || isUploading}
                    >
                      <ArrowUpIcon className="w-4 h-4 cursor-pointer" />
                    </Button>
                  </div>
                </div>
              </InputGroupAddon>
            </InputGroup>
          </div>

         
        </form>

        {/* Footer Tips */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Supported formats: CSV, XLS, XLSX • Max file size: 10MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;