export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ACTIVE_ATTACHMENTS_PER_TICKET = 5;

export function isAllowedMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
}

export function isAllowedFileSize(sizeInBytes?: number): boolean {
  if (typeof sizeInBytes !== "number" || sizeInBytes <= 0) return false;
  return sizeInBytes <= MAX_FILE_SIZE_BYTES;
}

export function validateRemovalReason(reason?: any): {
  isValid: boolean;
  message?: string;
  sanitizedReason?: string;
} {
  if (typeof reason !== "string") {
    return {
      isValid: false,
      message: "Removal reason is required.",
    };
  }

  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    return {
      isValid: false,
      message: "Removal reason must be at least 3 characters.",
    };
  }

  if (trimmed.length > 255) {
    return {
      isValid: false,
      message: "Removal reason must not exceed 255 characters.",
    };
  }

  return {
    isValid: true,
    sanitizedReason: trimmed,
  };
}
