import { useState, useRef } from 'react';
import { Send, Loader2, Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChatStore } from '@/store/chatStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const MessageInput = () => {
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { currentChatId, selectedModel, setSelectedModel, isLoading, setIsLoading } =
    useChatStore();
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    // Allowed file types: TXT, CSV, EXCEL
    const allowedTypes = [
      'text/plain',  
      'text/csv',  
      'application/vnd.ms-excel',  
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const allowedExtensions = ['.txt', '.csv', '.xls', '.xlsx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast({
        title: 'Invalid file type',
        description: 'Only TXT, CSV, and Excel files are allowed.',
        variant: 'destructive',
      });
      return;
    }

    // Max file size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload files smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadedFile(file);
    toast({
      title: 'File uploaded',
      description: `${file.name} has been attached.`,
    });
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        reader.readAsText(file);
      } else {
        resolve(`[Excel File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)}KB]`);
      }
    });
  };

  const sendMessage = async () => {
    if ((!input.trim() && !uploadedFile) || !currentChatId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setIsUploading(true);

    try {
      let messageContent = userMessage;
      let fileContent = '';
      
      if (uploadedFile) {
        try {
          fileContent = await readFileContent(uploadedFile);
          messageContent = messageContent 
            ? `${messageContent}\n\n--- Uploaded File ---\n${fileContent}`
            : `--- Uploaded File ---\n${fileContent}`;
        } catch (error) {
          console.error('Error reading file:', error);
          messageContent = messageContent 
            ? `${messageContent}\n\n--- Uploaded File ---\n[File: ${uploadedFile.name} - Error reading content]`
            : `--- Uploaded File ---\n[File: ${uploadedFile.name} - Error reading content]`;
        }
      }

      const { error: userError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          role: 'user',
          text: messageContent,
          file_name: uploadedFile?.name || null,
          file_type: uploadedFile?.type || null,
          file_size: uploadedFile?.size || null,
        });

      if (userError) throw userError;

      const endpoint =
        selectedModel === 'Numerical'
          ? 'http://localhost:8000/predictes'
          : 'http://localhost:8000/predict';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: messageContent,
          file_name: uploadedFile?.name,
          file_type: uploadedFile?.type,
          has_file: !!uploadedFile
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch AI response');

      const data = await res.json();
      const aiResponseText = `${data.sentiment} (Score: ${data.score})`;

      await supabase.from('messages').insert({
        chat_id: currentChatId,
        role: 'assistant',
        text: aiResponseText,
      });

      removeFile();

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
      setInput(input);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileUpload(files[0]);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('csv') || fileType.includes('text')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="border-t bg-gradient-to-b from-zinc-900 to-zinc-800 border-border bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Model Selector and File Upload */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 ">
            <Select
              value={selectedModel}
              onValueChange={(v: 'Numerical' | 'Non-Numerical') => setSelectedModel(v)}
            >
              <SelectTrigger className="w-50 bg-gradient-to-b from-zinc-900 to-zinc-800  ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='bg-gradient-to-b from-zinc-900 to-zinc-700'>
                <SelectItem value="Numerical" className="flex  items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Numerical</Badge>
                  <span className='m-2'>Model</span>
                </SelectItem>
                <SelectItem value="Non-Numerical" className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Non-Numerical</Badge>
                  <span className='m-2'>Model</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2  ">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".txt,.csv,.xls,.xlsx"
              className="hidden"
              disabled={!currentChatId || isLoading}
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!currentChatId || isLoading}
              className="flex items-center gap-2 bg-gradient-to-b from-zinc-900 to-zinc-700"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload File</span>
            </Button>
          </div>
        </div>

        {/* Uploaded File Preview */}
        {uploadedFile && (
          <div className="mb-3 animate-in fade-in duration-200">
            <Card className="border-gray bg-gradient-to-b from-zinc-900 to-zinc-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg">{getFileIcon(uploadedFile.type)}</span>
                    <FileText className="h-5 w-5 text-gray-300 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadedFile.size)} • {uploadedFile.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    disabled={isLoading}
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Message input area */}
        <Card 
          className="shadow-sm border-2 bg-gradient-to-b from-zinc-900 to-zinc-800 text-gray-300 transition-all duration-200 focus-within:border-gray-500 focus-within:shadow-md"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CardContent className="p-0">
            <div className="flex gap-2  p-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  currentChatId 
                    ? "Type your message or upload a file... (Enter to send)"
                    : "Please select or create a chat to start messaging"
                }
                className="min-h-[80px] bg-gradient-to-b from-zinc-800 to-zinc-900 text-gray-300 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-base flex-1"
                disabled={!currentChatId || isLoading}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={sendMessage}
                  disabled={(!input.trim() && !uploadedFile) || !currentChatId || isLoading}
                  size="icon"
                  className="h-12 w-12 bg-gradient-to-b from-zinc-900 to-zinc-300 text-gray-300 transition-all hover:scale-105 active:scale-95"
                  variant={isLoading ? "secondary" : "default"}
                >
                  {isLoading 
                    ? <Loader2 className="h-5 w-5 animate-spin" /> 
                    : <Send className="h-5 text-gray-100 w-5" />
                  }
                </Button>
                
               
               
              </div>
            </div>
            
            {/* Input footer */}
            <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-b from-zinc-700 to-zinc-800 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-4 flex-wrap">
                <span>{input.length} characters</span>
                {(isLoading || isUploading) && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{isUploading ? 'Processing file...' : 'Processing...'}</span>
                  </div>
                )}
                {uploadedFile && (
                  <div className="flex items-center gap-1 text-green-600">
                    <FileText className="h-3 w-3" />
                    <span>File attached</span>
                  </div>
                )}
              </div>
              <span className="hidden sm:block">
                {selectedModel === 'Numerical' ? 'Numerical Model' : 'Non-Numerical Model'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Supported file info */}
        <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Supported: .txt, .csv, .xls, .xlsx (Max 5MB)</span>
          <span className="flex items-center gap-1"><Upload className="h-3 w-3" /> Drag & drop files here</span>
        </div>
      </div>
    </div>
  );
};
