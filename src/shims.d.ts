declare module '*.css';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'react' {
  export const StrictMode: any;
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useState<T>(initial: T | (() => T)): [T, (value: T) => void];
  const React: { StrictMode: any };
  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  export function createRoot(element: HTMLElement): { render(children: unknown): void };
  const ReactDOM: { createRoot: typeof createRoot };
  export default ReactDOM;
}

declare module '@vitejs/plugin-react' {
  const react: () => unknown;
  export default react;
}

declare module 'vite' {
  export function defineConfig(config: unknown): unknown;
}

declare module '@capacitor/cli' {
  export interface CapacitorConfig {
    appId: string;
    appName: string;
    webDir: string;
    server?: { androidScheme?: string; allowNavigation?: string[] };
  }
}

declare module '@capacitor/core' {
  export const Capacitor: { isNativePlatform(): boolean };
  export function registerPlugin<T>(name: string): T;
}

declare module '@capacitor/preferences' {
  export const Preferences: {
    get(options: { key: string }): Promise<{ value: string | null }>;
    set(options: { key: string; value: string }): Promise<void>;
  };
}

declare module '@capacitor/filesystem' {
  export interface FileInfo { name: string; type?: 'file' | 'directory'; size?: number; mtime?: number }
  export interface ReaddirResult { files: Array<string | FileInfo> }
  export interface StatResult { size?: number; mtime?: number }
  export const Filesystem: {
    readdir(options: { path: string }): Promise<ReaddirResult>;
    stat(options: { path: string }): Promise<StatResult>;
  };
}
