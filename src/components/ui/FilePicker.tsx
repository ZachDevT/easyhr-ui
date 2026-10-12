"use client";

import React, { useRef, useState, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import styles from "./FilePicker.module.css";

export interface FilePickerProps {
  label?: string;
  value?: string | null;
  onChange: (fileDataUrl: string | null, file?: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  aspectRatio?: "square" | "wide" | "any";
  placeholderText?: string;
}

export function FilePicker({
  label,
  value,
  onChange,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  maxSizeMB = 5,
  aspectRatio = "square",
  placeholderText = "Upload file or drag and drop",
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds limit (${maxSizeMB}MB max).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange(dataUrl, file);
    };
    reader.onerror = () => {
      setError("Failed to read the selected file.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    onChange(null, null);
    setError(null);
  };

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div
        className={`${styles.dropzone} ${dragActive ? styles.dragActive : ""} ${
          value ? styles.hasPreview : ""
        } ${aspectRatio === "square" ? styles.aspectSquare : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {value ? (
          <div className={styles.previewContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className={styles.previewImage} />
            <button
              type="button"
              className={styles.removeButton}
              onClick={handleRemove}
              title="Remove file"
            >
              <X size={14} />
            </button>
            <div className={styles.changeOverlay}>
              <UploadCloud size={16} />
              <span>Change</span>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.iconWrapper}>
              <ImageIcon size={20} />
            </div>
            <div className={styles.uploadText}>
              <b>{placeholderText}</b>
              <small>PNG, JPG, WEBP, or SVG up to {maxSizeMB}MB</small>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className={styles.errorText}>
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default FilePicker;
