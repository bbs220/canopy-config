import { useState, useEffect, useRef } from "react";
import { Pane } from "tweakpane";

type FolderApi = ReturnType<Pane["addFolder"]>;

type TweakpaneOptions<V = unknown> = {
  value: V;
  folder?: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Record<string, V> | { text: string; value: V }[];
  picker?: "inline" | "popup";
  expanded?: boolean;
  [key: string]: unknown;
};

type ExtractValue<T> = T extends { value: infer V } ? V : T;

type TweakpaneState<T> = {
  [K in keyof T]: ExtractValue<T[K]>;
};

type GlobalFolderConfig = {
  title: string;
  expanded?: boolean;
};

type ConfigType<T> = {
  [K in keyof T]: T[K] extends { value: infer V } ? TweakpaneOptions<V> : T[K];
};

let sharedPane: Pane | null = null;
let sharedFolders: Record<string, FolderApi> = {};
let activeHooksCount = 0;

export function useTweakpane<T extends Record<string, unknown>>(
  config: ConfigType<T>,
): TweakpaneState<T>;

export function useTweakpane<T extends Record<string, unknown>>(
  folderConfig: string | GlobalFolderConfig,
  config: ConfigType<T>,
): TweakpaneState<T>;

export function useTweakpane<T extends Record<string, unknown>>(
  arg1: string | GlobalFolderConfig | ConfigType<T>,
  arg2?: ConfigType<T>,
): TweakpaneState<T> {
  const hasFolderConfig = arg2 !== undefined;
  const folderOptions = hasFolderConfig
    ? typeof arg1 === "string"
      ? { title: arg1 }
      : (arg1 as GlobalFolderConfig)
    : undefined;

  const config = (hasFolderConfig ? arg2 : arg1) as ConfigType<T>;

  const [params, setParams] = useState<TweakpaneState<T>>(() => {
    const initialState = {} as TweakpaneState<T>;

    (Object.keys(config) as Array<keyof T>).forEach((key) => {
      const item = config[key];
      const isObjectConfig =
        typeof item === "object" && item !== null && "value" in item;

      initialState[key] = (
        isObjectConfig ? (item as { value: unknown }).value : item
      ) as ExtractValue<T[keyof T]>;
    });

    return initialState;
  });

  const configRef = useRef(config);
  const folderOptionsRef = useRef(folderOptions);
  const tweakpaneTargetRef = useRef({ ...params });

  useEffect(() => {
    // disable tweakpane in production environment
    if (import.meta.env.PROD) {
      return;
    }

    if (!sharedPane) {
      sharedPane = new Pane({ title: "🛠️ Controls" });
      sharedFolders = {};
    }
    activeHooksCount++;

    const initialConfig = configRef.current;
    const baseFolderOpts = folderOptionsRef.current;
    const bindings: Array<{ dispose: () => void }> = [];

    const getFolder = (
      path: string,
      options?: { expanded?: boolean },
    ): FolderApi => {
      if (sharedFolders[path]) {
        if (options?.expanded !== undefined) {
          sharedFolders[path].expanded = options.expanded;
        }
        return sharedFolders[path];
      }

      const parts = path.split("/");
      let currentPane: Pane | FolderApi = sharedPane!;
      let currentPath = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath += (currentPath ? "/" : "") + part;

        if (!sharedFolders[currentPath]) {
          const isLastPart = i === parts.length - 1;
          sharedFolders[currentPath] = currentPane.addFolder({
            title: part,
            ...(isLastPart && options?.expanded !== undefined
              ? { expanded: options.expanded }
              : {}),
          });
        }
        currentPane = sharedFolders[currentPath];
      }
      return currentPane as FolderApi;
    };

    if (baseFolderOpts?.title) {
      getFolder(baseFolderOpts.title, { expanded: baseFolderOpts.expanded });
    }

    (Object.keys(initialConfig) as Array<keyof T>).forEach((key) => {
      const item = initialConfig[key];
      const isConfigObject =
        typeof item === "object" && item !== null && "value" in item;

      let options: Omit<TweakpaneOptions, "folder"> = {};
      let itemFolder: string | undefined = undefined;

      if (isConfigObject) {
        const { folder: f, ...rest } = item as TweakpaneOptions;
        itemFolder = f;
        options = rest;
      }

      const finalFolderPath = [baseFolderOpts?.title, itemFolder]
        .filter(Boolean)
        .join("/");

      const targetPane = finalFolderPath
        ? getFolder(finalFolderPath)
        : sharedPane!;

      const binding = targetPane
        .addBinding(tweakpaneTargetRef.current, key as string, options)
        .on("change", (ev: { value: unknown }) => {
          setParams((prev) => ({ ...prev, [key]: ev.value }));
        });

      bindings.push(binding);
    });

    return () => {
      bindings.forEach((binding) => binding.dispose());
      activeHooksCount--;

      if (activeHooksCount === 0 && sharedPane) {
        sharedPane.dispose();
        sharedPane = null;
        sharedFolders = {};
      }
    };
  }, []);

  return params;
}
