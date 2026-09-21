import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, Trash2, Loader2, Link2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { uploadToCloudinary, validateImageFile, isCloudinaryConfigured } from "../../services/cloudinary.service";
import { useTranslation } from "../../i18n/useTranslation";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  folder?: string;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = "",
  onChange,
  onUploadingChange,
  folder = "products",
  disabled = false,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDirectUrl, setShowDirectUrl] = useState(false);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);

  const currentImageUrl = previewOverride || value;
  const configured = isCloudinaryConfigured();

  const handleFile = async (file: File) => {
    if (disabled || uploading) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || t("product.uploadFailed"));
      return;
    }

    if (!configured) {
      toast.error(t("product.missingCloudinaryConfig"));
      setShowDirectUrl(true);
      return;
    }

    // Generate local preview immediately for snappy UX
    const localPreview = URL.createObjectURL(file);
    setPreviewOverride(localPreview);

    setUploading(true);
    setUploadProgress(0);
    onUploadingChange?.(true);

    try {
      const uploadedUrl = await uploadToCloudinary(file, {
        folder,
        onProgress: (pct) => setUploadProgress(pct),
      });

      onChange(uploadedUrl);
      setPreviewOverride(null);
      toast.success(t("product.uploadSuccess"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("product.uploadFailed");
      toast.error(msg);
      // Revert preview if we didn't have an existing value
      if (!value) {
        setPreviewOverride(null);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      onUploadingChange?.(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || uploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewOverride(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Main Upload / Preview Area */}
      {currentImageUrl ? (
        <div
          className="relative flex items-center gap-3.5 p-3 rounded-xl border transition-all"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border-strong)",
          }}
        >
          {/* Thumbnail preview */}
          <div
            className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border"
            style={{
              background: "var(--surface-1)",
              borderColor: "var(--border)",
            }}
          >
            <img
              src={currentImageUrl}
              alt="Product preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white">
                <Loader2 size={16} className="animate-spin text-emerald-400" />
                <span className="text-[10px] font-semibold">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {uploading ? t("product.uploading") : t("product.uploadImage")}
              </span>
            </div>

            <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
              {currentImageUrl.startsWith("blob:") ? "Uploading..." : currentImageUrl}
            </p>

            {uploading ? (
              <div className="w-full bg-neutral-700/40 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg press"
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                  }}
                >
                  {t("product.changeImage")}
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleRemove}
                  className="text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 press"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                  }}
                >
                  <Trash2 size={12} />
                  {t("product.removeImage")}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty Dropzone State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            isDragging ? "border-emerald-500 scale-[0.99]" : "hover:border-neutral-400 dark:hover:border-neutral-500"
          }`}
          style={{
            background: isDragging ? "rgba(16, 185, 129, 0.08)" : "var(--surface-2)",
            borderColor: isDragging ? "#10b981" : "var(--border-strong)",
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
              <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {t("product.uploading")} {uploadProgress > 0 ? `(${uploadProgress}%)` : ""}
              </p>
              <div className="w-36 bg-neutral-700/40 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center py-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}
              >
                <UploadCloud size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {t("product.dragOrClick")}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {t("product.imageHint")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Direct URL toggle & input (fallback / manual editing) */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowDirectUrl((prev) => !prev)}
          className="text-[11px] flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: "var(--text-muted)" }}
        >
          <Link2 size={11} />
          {t("product.orEnterUrl")}
        </button>

        {showDirectUrl && (
          <div className="mt-1.5">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://res.cloudinary.com/... or https://..."
              className="w-full text-xs rounded-xl px-3 py-2 outline-none border transition-colors"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border-strong)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        )}
      </div>

      {/* Friendly configuration warning if Cloudinary environment variables aren't set */}
      {!configured && (
        <div
          className="flex items-start gap-2 p-2.5 rounded-xl border text-[11px]"
          style={{
            background: "rgba(234, 179, 8, 0.08)",
            borderColor: "rgba(234, 179, 8, 0.25)",
            color: "#eab308",
          }}
        >
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <p className="leading-tight">
            {t("product.missingCloudinaryConfig")}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
