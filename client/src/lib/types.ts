export interface FileItem {
  key: string;
  name: string;
  size?: number;
  lastModified?: Date;
  isFolder: boolean;
  icon: string;
  color: string;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface ConnectionStatus {
  connected: boolean;
  region?: string;
}

export interface AuthMethod {
  type: 'accessKeys' | 'roleArn';
}
