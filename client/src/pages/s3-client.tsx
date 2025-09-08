import { useState } from "react";
import ConnectionManager from "@/components/connection-manager";
import BucketList from "@/components/bucket-list";
import FileBrowser from "@/components/file-browser";
import UploadModal from "@/components/upload-modal";
import { Cloud } from "lucide-react";

export default function S3Client() {
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-80 bg-card border-r border-border flex flex-col">
        {/* App Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Cloud className="text-primary-foreground h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">S3 Client</h1>
              <p className="text-xs text-muted-foreground">AWS Storage Manager</p>
            </div>
          </div>
        </div>

        {/* Connection Manager */}
        <ConnectionManager />

        {/* Bucket List */}
        <BucketList 
          selectedBucket={selectedBucket}
          onSelectBucket={setSelectedBucket}
          onPathChange={setCurrentPath}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <FileBrowser
          selectedBucket={selectedBucket}
          currentPath={currentPath}
          onPathChange={setCurrentPath}
          onShowUpload={() => setShowUploadModal(true)}
        />
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        bucketName={selectedBucket}
        currentPath={currentPath}
      />
    </div>
  );
}
