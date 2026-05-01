import { create } from 'zustand';

interface MenuState {
  collapsed: boolean;
  expandedKeys: string[];
  activeKey: string;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setExpandedKeys: (keys: string[]) => void;
  toggleExpanded: (key: string) => void;
  setActiveKey: (key: string) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  collapsed: false,
  expandedKeys: [],
  activeKey: '',
  setCollapsed: (collapsed) => set({ collapsed }),
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  setExpandedKeys: (keys) => set({ expandedKeys: keys }),
  toggleExpanded: (key) => set((state) => {
    const isExpanded = state.expandedKeys.includes(key);
    return {
      expandedKeys: isExpanded
        ? state.expandedKeys.filter((k) => k !== key)
        : [...state.expandedKeys, key],
    };
  }),
  setActiveKey: (key) => set({ activeKey: key }),
}));