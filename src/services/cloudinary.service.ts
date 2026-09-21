import axios from "axios";

export interface CloudinaryUploadOptions {
  folder?: string;
  onProgress?: (progressPercent: number) => void;
}

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

const DEFAULT_CLOUD_NAME = "dsoxcl60d";
const DEFAULT_UPLOAD_PRESET = "prompthub";

export const getCloudinaryConfig = () => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || DEFAULT_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() || DEFAULT_UPLOAD_PRESET;
  return {
    cloudName,
    uploadPreset,
    isConfigured: Boolean(cloudName && uploadPreset),
  };
};

export const isCloudinaryConfigured = (): boolean => {
  return getCloudinaryConfig().isConfigured;
};

/**
 * Validates file type and size before sending to Cloudinary.
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
    return {
      valid: false,
      error: "Please select a valid image file (JPG, PNG, WEBP, GIF, SVG).",
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size exceeds the 1MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
    };
  }

  return { valid: true };
};

/**
 * Upload an image file directly to Cloudinary using an unsigned upload preset.
 */
export const uploadToCloudinary = async (
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<string> => {
  const { cloudName, uploadPreset, isConfigured } = getCloudinaryConfig();

  if (!isConfigured) {
    throw new Error(
      "Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your environment variables."
    );
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (options.folder) {
    formData.append("folder", options.folder);
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        // Let the browser set the boundary automatically
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(percent);
        }
      },
    });

    const data = response.data;
    return (data.secure_url || data.url) as string;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const serverMessage = err.response?.data?.error?.message;
      if (serverMessage) {
        throw new Error(`Cloudinary: ${serverMessage}`);
      }
      if (err.message) {
        throw new Error(err.message);
      }
    }
    throw new Error("Failed to upload image to Cloudinary. Please try again.");
  }
};

/**
 * Helper to generate an optimized Cloudinary thumbnail / transformed image URL.
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  transformations: { width?: number; height?: number; crop?: string; quality?: string } = {}
): string => {
  if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
    return imageUrl;
  }

  const { width = 300, height = 300, crop = "fill", quality = "auto" } = transformations;
  const transformString = `c_${crop},w_${width},h_${height},q_${quality},f_auto`;

  // Standard Cloudinary URL format: .../image/upload/(v12345/)?...
  const uploadIndex = imageUrl.indexOf("/upload/");
  if (uploadIndex === -1) return imageUrl;

  const prefix = imageUrl.slice(0, uploadIndex + 8);
  const rest = imageUrl.slice(uploadIndex + 8);

  return `${prefix}${transformString}/${rest}`;
};
