import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { S3Bucket } from "@shared/schema";

interface BucketListProps {
  selectedBucket: string;
  onSelectBucket: (bucket: string) => void;
  onPathChange: (path: string) => void;
}

export default function BucketList({ selectedBucket, onSelectBucket, onPathChange }: BucketListProps) {
  const { data: buckets = [], isLoading, refetch } = useQuery<S3Bucket[]>({
    queryKey: ['/api/buckets'],
    enabled: true,
  });

  const handleSelectBucket = (bucketName: string) => {
    onSelectBucket(bucketName);
    onPathChange("");
  };

  return (
    <div className="flex-1 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Buckets</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-buckets"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {buckets.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No buckets found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {buckets.map((bucket) => (
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
          </div>
        )}
      </div>
    </div>
  );
}
