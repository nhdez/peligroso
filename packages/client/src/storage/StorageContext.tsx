import React, { createContext, useContext, useState, useEffect } from "react";
import type { ObjectStorageConfig, StorageProviderType } from "shared";

const STORAGE_CONFIG_KEY = "truco_object_storage_config";

export const DEFAULT_STORAGE_CONFIG: ObjectStorageConfig = {
  provider: "cloudflare-r2",
  endpointUrl: "https://<account-id>.r2.cloudflarestorage.com",
  bucketName: "truco-assets",
  publicCdnDomain: "https://assets.truco.app",
  accessKeyId: "",
  secretAccessKey: "",
  region: "auto",
  isEnabled: false,
};

interface StorageContextType {
  storageConfig: ObjectStorageConfig;
  saveStorageConfig: (config: ObjectStorageConfig) => void;
  uploadAsset: (file: File, folder: "avatars" | "mats" | "decks") => Promise<string>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [storageConfig, setStorageConfig] = useState<ObjectStorageConfig>(() => {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_STORAGE_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(storageConfig));
  }, [storageConfig]);

  function saveStorageConfig(config: ObjectStorageConfig) {
    setStorageConfig(config);
  }

  async function uploadAsset(file: File, folder: "avatars" | "mats" | "decks"): Promise<string> {
    const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    if (storageConfig.isEnabled && storageConfig.publicCdnDomain) {
      // Simulate Cloudflare R2 / S3 CDN URL generation
      const cleanCdn = storageConfig.publicCdnDomain.replace(/\/$/, "");
      return `${cleanCdn}/${filename}`;
    } else {
      // Local Fallback: Convert to Data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }
  }

  return (
    <StorageContext.Provider
      value={{
        storageConfig,
        saveStorageConfig,
        uploadAsset,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) throw new Error("useStorage must be used within StorageProvider");
  return context;
}
