import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Upload,
  FolderPlus,
  List,
  Search,
  RefreshCw,
  Download,
  Link2,
  Trash2,
  Folder,
  File,
  FileArchive,
  FileText,
  FileImage,
  ChevronRight,
} from "lucide-react";
import type { S3Object } from "@shared/schema";
import type { FileItem, BreadcrumbItem } from "@/lib/types";

interface FileBrowserProps {
  selectedBucket: string;
  currentPath: string;
  onPathChange: (path: string) => void;
  onShowUpload: () => void;
}

export default function FileBrowser({ selectedBucket, currentPath, onPathChange, onShowUpload }: FileBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: objects = [], isLoading, refetch } = useQuery<S3Object[]>({
    queryKey: ['/api/buckets', selectedBucket, 'objects', `?prefix=${encodeURIComponent(currentPath)}`],
    enabled: !!selectedBucket,
  });

  const downloadMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiRequest('GET', `/api/buckets/${selectedBucket}/objects/${encodeURIComponent(key)}/download`);
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.downloadUrl, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => apiRequest('DELETE', `/api/buckets/${selectedBucket}/objects/${encodeURIComponent(key)}`),
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "File deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/buckets', selectedBucket, 'objects'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (key: string, isFolder: boolean) => {
    if (isFolder) return { icon: Folder, color: "text-amber-400" };
    
    const ext = key.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'zip':
      case 'tar':
      case 'gz':
      case 'rar':
        return { icon: FileArchive, color: "text-green-400" };
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return { icon: FileImage, color: "text-purple-400" };
      case 'txt':
      case 'md':
      case 'json':
      case 'xml':
      case 'yml':
      case 'yaml':
        return { icon: FileText, color: "text-blue-400" };
      default:
        return { icon: File, color: "text-gray-400" };
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "—";
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const crumbs: BreadcrumbItem[] = [{ name: selectedBucket, path: "" }];
    
    if (currentPath) {
      const parts = currentPath.split('/').filter(Boolean);
      let path = "";
      
      for (const part of parts) {
        path += part + '/';
        crumbs.push({ name: part, path });
      }
    }
    
    return crumbs;
  };

  const handleNavigate = (path: string) => {
    onPathChange(path);
  };

  const handleFolderClick = (key: string) => {
    onPathChange(key);
  };

  const handleDownload = (key: string) => {
    downloadMutation.mutate(key);
  };

  const handleDelete = (key: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(key);
    }
  };

  const handleCopyUrl = async (key: string) => {
    try {
      const response = await apiRequest('GET', `/api/buckets/${selectedBucket}/objects/${encodeURIComponent(key)}/download`);
      const data = await response.json();
      await navigator.clipboard.writeText(data.downloadUrl);
      toast({
        title: "URL Copied",
        description: "Download URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  const filteredObjects = objects.filter((obj: S3Object) => 
    searchTerm === "" || obj.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedBucket) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Bucket Selected</h3>
          <p className="text-sm text-muted-foreground">Select a bucket from the sidebar to browse files</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-sm">
            {getBreadcrumbs().map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-2" />}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary hover:text-primary/80"
                  onClick={() => handleNavigate(crumb.path)}
                  data-testid={`breadcrumb-${crumb.name}`}
                >
                  {crumb.name}
                </Button>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button onClick={onShowUpload} data-testid="button-upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <Button variant="secondary" data-testid="button-new-folder">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-muted/20 border-b border-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" data-testid="button-list-view">
              <List className="mr-2 h-3 w-3" />
              List View
            </Button>
            <div className="text-xs text-muted-foreground" data-testid="text-item-count">
              {filteredObjects.length} items
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-48 text-xs"
                data-testid="input-search"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-muted/10 border-b border-border px-4 py-3">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground">
            <div className="col-span-6">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Modified</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>

        {/* Content */}
        <div className="divide-y divide-border">
          {filteredObjects.length === 0 && !isLoading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No files found</p>
            </div>
          ) : (
            filteredObjects.map((object: S3Object) => {
              const { icon: Icon, color } = getFileIcon(object.key, object.isFolder);
              const displayName = object.isFolder 
                ? object.key.split('/').filter(Boolean).pop() || object.key
                : object.key.split('/').pop() || object.key;

              return (
                <div
                  key={object.key}
                  className="px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors group"
                  onClick={() => object.isFolder ? handleFolderClick(object.key) : undefined}
                  data-testid={`item-${object.key}`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 flex items-center gap-3">
                      <Icon className={`${color} h-4 w-4`} />
                      <div>
                        <p className="text-sm font-medium text-foreground truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {object.key}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {formatSize(object.size)}
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {formatDate(object.lastModified)}
                    </div>
                    <div className="col-span-2">
                      {!object.isFolder && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(object.key);
                            }}
                            data-testid={`button-download-${object.key}`}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyUrl(object.key);
                            }}
                            data-testid={`button-copy-url-${object.key}`}
                          >
                            <Link2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(object.key);
                            }}
                            data-testid={`button-delete-${object.key}`}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-card border-t border-border px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span data-testid="text-total-items">{filteredObjects.length} items</span>
          </div>
          <div className="flex items-center gap-4">
            <span data-testid="text-current-region">Region: {selectedBucket ? 'us-east-1' : '—'}</span>
            <span data-testid="text-storage-class">Standard</span>
          </div>
        </div>
      </div>
    </>
  );
}
