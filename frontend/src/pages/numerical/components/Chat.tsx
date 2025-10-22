import { useRef, useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { ArrowUpIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

const Chat = () => {
  const [mode, setMode] = useState("Num");
  const [filePreview, setFilePreview] = useState<string | null>(null);
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

    setFilePreview(file.name); // show filename as preview
  };

  const removeFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePreview) return;
    alert(`Sending file: ${filePreview}`);
    removeFile();
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-lg px-4">
        <form onSubmit={handleSend}>
          {/* Show file preview above input */}
          {filePreview && (
            <div className="mb-2 flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-200 rounded-lg">{filePreview}</span>
              <button
                type="button"
                className="text-red-500"
                onClick={removeFile}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <InputGroup>
            <InputGroupTextarea
              placeholder={filePreview ? "" : "Ask, Search or Chat..."}
              value=""
              readOnly={!!filePreview}
            />

            <InputGroupAddon align="block-end">
              {/* File Upload */}
              <InputGroupButton
                variant="outline"
                className="rounded-full relative"
                size="icon-xs"
              >
                <IconPlus />
                <input
                  type="file"
                  accept=".csv, .xls, .xlsx"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </InputGroupButton>

              {/* Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InputGroupButton variant="ghost">{mode}</InputGroupButton>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="[--radius:0.95rem]"
                >
                  {mode !== "Num" && (
                    <DropdownMenuItem onClick={() => setMode("Num")}>
                      Num
                    </DropdownMenuItem>
                  )}
                  {mode !== "Non-Num" && (
                    <DropdownMenuItem onClick={() => setMode("Non-Num")}>
                      Non-Num
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="!h-4" />

              {/* Send button */}
              <InputGroupButton
                variant="default"
                className="rounded-full"
                size="icon-xs"
                disabled={!filePreview}
              >
                <ArrowUpIcon />
                <span className="sr-only">Send</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
    </div>
  );
};

export default Chat;
