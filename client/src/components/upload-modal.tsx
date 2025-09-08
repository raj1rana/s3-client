import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, File, X } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucketName: string;
  currentPath: string;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'ready' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function UploadModal({ isOpen, onClose, bucketName, currentPath }: UploadModalProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (fileData: { file: File; key: string }) => {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('key', fileData.key);

      // Note: This would need to be implemented on the backend
      const response = await fetch(`/api/buckets/${bucketName}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buckets', bucketName, 'objects'] });
    },
  });

  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    const newFiles: FileWithProgress[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'ready',
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startUpload = async () => {
    for (let i = 0; i < files.length; i++) {
      const fileWithProgress = files[i];
      if (fileWithProgress.status !== 'ready') continue;

      try {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'uploading' as const } : f
        ));

        const key = currentPath + fileWithProgress.file.name;
        
        await uploadMutation.mutateAsync({
          file: fileWithProgress.file,
          key,
        });

        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'completed' as const, progress: 100 } : f
        ));

      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error' as const, 
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        ));
      }
    }

    const allCompleted = files.every(f => f.status === 'completed' || f.status === 'error');
    if (allCompleted) {
      toast({
        title: "Upload Complete",
        description: "All files have been processed",
      });
    }
  };

  const handleClose = () => {
    setFiles([]);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusColor = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'ready': return 'text-blue-400';
      case 'uploading': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusText = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'uploading': return 'Uploading...';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" data-testid="modal-upload">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            data-testid="drop-zone"
          >
            <CloudUpload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-foreground mb-1">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground">Maximum file size: 5GB</p>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              data-testid="input-file"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((fileWithProgress, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  data-testid={`file-item-${index}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {fileWithProgress.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileWithProgress.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-xs ${getStatusColor(fileWithProgress.status)}`}>
                      {getStatusText(fileWithProgress.status)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={fileWithProgress.status === 'uploading'}
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={startUpload}
              disabled={files.length === 0 || uploadMutation.isPending}
              className="flex-1"
              data-testid="button-start-upload"
            >
              {uploadMutation.isPending ? "Uploading..." : "Start Upload"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
