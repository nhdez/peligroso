import React, { createContext, useContext, useState, useEffect } from "react";
import type { ObjectStorageConfig } from "shared";
import { supabase } from "../supabaseClient.js";

const STORAGE_CONFIG_KEY = "truco_object_storage_config";

export const DEFAULT_STORAGE_CONFIG: ObjectStorageConfig = {
  provider: "supabase-storage",
  endpointUrl: "https://<your-project-id>.supabase.co/storage/v1",
  bucketName: "peligroso-storage",
  publicCdnDomain: "",
  accessKeyId: "",
  secretAccessKey: "",
  region: "auto",
  isEnabled: true,
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
    const sanitizeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${folder}/${Date.now()}-${sanitizeName}`;

    // 1. Supabase Object Storage Upload
    if (storageConfig.isEnabled && storageConfig.provider === "supabase-storage" && supabase) {
      const bucketName = storageConfig.bucketName || "peligroso-storage";
      const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (error) {
        console.error("Supabase Storage upload error:", error);
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    }

    // 2. Generic S3 / Cloudflare R2 CDN URL Generation
    if (storageConfig.isEnabled && storageConfig.publicCdnDomain) {
      const cleanCdn = storageConfig.publicCdnDomain.replace(/\/$/, "");
      return `${cleanCdn}/${filePath}`;
    }

    // 3. Local Fallback: Convert file to base64 Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
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
