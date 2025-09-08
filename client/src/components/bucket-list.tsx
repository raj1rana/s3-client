import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { S3Bucket } from "@shared/schema";

interface BucketListProps {
  selectedBucket: string;
  onSelectBucket: (bucket: string) => void;
  onPathChange: (path: string) => void;
}

export default function BucketList({ selectedBucket, onSelectBucket, onPathChange }: BucketListProps) {
  const [manualBucketName, setManualBucketName] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const { data: buckets = [], isLoading, error, refetch } = useQuery<S3Bucket[]>({
    queryKey: ['/api/buckets'],
    enabled: true,
    retry: false,
  });

  const handleSelectBucket = (bucketName: string) => {
    onSelectBucket(bucketName);
    onPathChange("");
  };

  const handleManualBucketAdd = () => {
    if (manualBucketName.trim()) {
      handleSelectBucket(manualBucketName.trim());
      setManualBucketName("");
      setShowManualInput(false);
    }
  };

  const hasListBucketsPermission = !error;

  return (
    <div className="flex-1 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Buckets</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManualInput(!showManualInput)}
              data-testid="button-add-bucket"
            >
              <Plus className="h-3 w-3" />
            </Button>
            {hasListBucketsPermission && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh-buckets"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Manual bucket input */}
        {showManualInput && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs font-medium text-muted-foreground">Enter Bucket Name</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="my-bucket-name"
                value={manualBucketName}
                onChange={(e) => setManualBucketName(e.target.value)}
                className="flex-1 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleManualBucketAdd()}
                data-testid="input-manual-bucket"
              />
              <Button
                size="sm"
                onClick={handleManualBucketAdd}
                disabled={!manualBucketName.trim()}
                data-testid="button-add-manual-bucket"
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this if you can't list buckets but have access to specific ones
            </p>
          </div>
        )}

        {/* Error message for no list buckets permission */}
        {error && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Cannot list buckets - you may not have ListAllMyBuckets permission. Use "Enter Bucket Name" to access specific buckets.
            </p>
          </div>
        )}

        {/* Bucket list */}
        {hasListBucketsPermission && buckets.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No buckets found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {hasListBucketsPermission && buckets.map((bucket) => (
              <div
                key={bucket.name}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                  selectedBucket === bucket.name ? 'bg-accent' : ''
                }`}
                onClick={() => handleSelectBucket(bucket.name)}
                data-testid={`bucket-${bucket.name}`}
              >
                <Folder className="text-primary h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{bucket.name}</p>
                  <p className="text-xs text-muted-foreground">{bucket.region}</p>
                </div>
              </div>
            ))}
            
            {/* Show manually selected bucket */}
            {selectedBucket && !buckets.find(b => b.name === selectedBucket) && (
              <div
                className="flex items-center gap-3 p-2 rounded-lg bg-accent"
                data-testid={`bucket-${selectedBucket}`}
              >
                <Folder className="text-primary h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{selectedBucket}</p>
                  <p className="text-xs text-muted-foreground">Manual entry</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
