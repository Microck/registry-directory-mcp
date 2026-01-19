export interface Registry {
  name: string;
  description: string;
  url: string;
  category?: string;
  tags?: string[];
  component_count?: number;
  last_updated?: string;
  scraped_at?: string;
  has_public_index?: boolean;
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
