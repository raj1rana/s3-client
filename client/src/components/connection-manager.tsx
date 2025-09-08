import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plug, Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/lib/types";

const AWS_REGIONS = [
  "us-east-1",
  "us-east-2", 
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1"
];

export default function ConnectionManager() {
  const [authMethod, setAuthMethod] = useState<'accessKeys' | 'roleArn'>('accessKeys');
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [roleArn, setRoleArn] = useState("");
  const [region, setRegion] = useState("us-east-1");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connectionStatus } = useQuery<ConnectionStatus>({
    queryKey: ['/api/connection/status'],
    refetchInterval: 5000,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (authMethod === 'accessKeys') {
        return apiRequest('POST', '/api/connect/credentials', {
          accessKeyId,
          secretAccessKey,
          region,
        });
      } else {
        return apiRequest('POST', '/api/connect/role', {
          roleArn,
          region,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Connected",
        description: "Successfully connected to AWS",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connection/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/buckets'] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to AWS",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/disconnect', {}),
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from AWS",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connection/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/buckets'] });
      setAccessKeyId("");
      setSecretAccessKey("");
      setRoleArn("");
    },
  });

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  return (
    <div className="p-6 border-b border-border">
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Connection</span>
          <div className="flex items-center gap-2">
            {connectionStatus?.connected ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-500" />
                <span className="text-xs text-muted-foreground">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {!connectionStatus?.connected ? (
          <>
            {/* Connection Type Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={authMethod === 'accessKeys' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setAuthMethod('accessKeys')}
                data-testid="button-access-keys"
              >
                Access Keys
              </Button>
              <Button
                variant={authMethod === 'roleArn' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setAuthMethod('roleArn')}
                data-testid="button-role-arn"
              >
                Role ARN
              </Button>
            </div>

            {/* Forms */}
            {authMethod === 'accessKeys' ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Access Key ID</Label>
                  <Input
                    type="text"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={accessKeyId}
                    onChange={(e) => setAccessKeyId(e.target.value)}
                    className="mt-1 font-mono text-sm"
                    data-testid="input-access-key-id"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Secret Access Key</Label>
                  <Input
                    type="password"
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    value={secretAccessKey}
                    onChange={(e) => setSecretAccessKey(e.target.value)}
                    className="mt-1 font-mono text-sm"
                    data-testid="input-secret-access-key"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Role ARN</Label>
                  <Input
                    type="text"
                    placeholder="arn:aws:iam::123456789012:role/S3AccessRole"
                    value={roleArn}
                    onChange={(e) => setRoleArn(e.target.value)}
                    className="mt-1 font-mono text-sm"
                    data-testid="input-role-arn"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-medium text-muted-foreground">Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="mt-1 text-sm" data-testid="select-region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AWS_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleConnect}
              disabled={connectMutation.isPending}
              className="w-full"
              data-testid="button-connect"
            >
              <Plug className="mr-2 h-4 w-4" />
              {connectMutation.isPending ? "Connecting..." : "Connect to AWS"}
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Region: {connectionStatus.region}
            </div>
            <Button
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              variant="destructive"
              className="w-full"
              data-testid="button-disconnect"
            >
              Disconnect
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
