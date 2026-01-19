export interface Registry {
  name: string;
  description: string;
  url: string;
}

export interface RegistryIndexItem {
  name: string;
  type: string;
  description?: string;
  files?: string[];
}

export interface ComponentResult {
  registryName: string;
  componentName: string;
  description?: string;
  url: string;
}
