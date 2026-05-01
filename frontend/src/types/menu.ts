export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path: string;
  children?: MenuItem[];
}

export interface MenuConfig {
  items: MenuItem[];
  collapsed: boolean;
  expandedKeys: string[];
  activeKey: string;
}