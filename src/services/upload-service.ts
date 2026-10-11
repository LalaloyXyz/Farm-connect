/* ------------------------------------------------------------------ */
/*  Upload service — Cloudflare R2 with fallback                       */
/*  R2 is optional; without env vars the service returns mock URLs.    */
/* ------------------------------------------------------------------ */

export interface UploadResult {
  url: string;
  thumbnailUrl: string;
}

export interface FileValidationError {
  valid: false;
  error: string;
}

export interface FileValidationSuccess {
  valid: true;
}

export type FileValidationResult = FileValidationError | FileValidationSuccess;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

export function validateFile(file: File): FileValidationResult {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      valid: false,
      error:
        "รองรับเฉพาะไฟล์รูปภาพประเภท JPG, PNG และ WebP เท่านั้น",
    };
  }

  if (!ALLOWED_EXTENSIONS.test(file.name)) {
    return {
      valid: false,
      error: "นามสกุลไฟล์ไม่ถูกต้อง (รองรับ .jpg, .jpeg, .png, .webp)",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const mb = MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `ไฟล์มีขนาดใหญ่เกินไป ขนาดสูงสุด ${mb} MB`,
    };
  }

  return { valid: true };
}

/* ------------------------------------------------------------------ */
/*  Thumbnail generation (client-side via canvas)                      */
/* ------------------------------------------------------------------ */

function generateThumbnailFromFile(file: File, maxWidth = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("ไม่สามารถสร้าง thumbnail ได้"));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("ไม่สามารถสร้าง thumbnail ได้"));
          }
        },
        file.type,
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("ไม่สามารถโหลดรูปภาพได้"));
    };

    img.src = url;
  });
}

/* ------------------------------------------------------------------ */
/*  Upload to R2 (or mock)                                             */
/* ------------------------------------------------------------------ */

async function uploadToR2(
  file: File,
  key: string
): Promise<{ url: string }> {
  const endpoint = process.env.NEXT_PUBLIC_R2_ENDPOINT;
  const bucket = process.env.NEXT_PUBLIC_R2_BUCKET;
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!endpoint || !bucket || !publicUrl) {
    throw new Error("R2 storage is not configured");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("key", key);
  formData.append("bucket", bucket);

  const res = await fetch(`${endpoint}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${body}`);
  }

  return { url: `${publicUrl}/${key}` };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Upload an image file.
 *
 * When R2 env vars are set, the file is uploaded to Cloudflare R2.
 * Otherwise a local data-URL / mock URL is returned so the app can
 * still function during development.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `uploads/${timestamp}-${random}.${ext}`;

  const isR2Configured =
    process.env.NEXT_PUBLIC_R2_ENDPOINT &&
    process.env.NEXT_PUBLIC_R2_BUCKET &&
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (isR2Configured) {
    const { url } = await uploadToR2(file, key);
    const thumbnailKey = `uploads/thumb-${timestamp}-${random}.${ext}`;
    let thumbnailUrl: string;

    try {
      const thumbBlob = await generateThumbnailFromFile(file);
      const thumbFile = new File([thumbBlob], `thumb-${file.name}`, {
        type: file.type,
      });
      const { url: thumbUrl } = await uploadToR2(thumbFile, thumbnailKey);
      thumbnailUrl = thumbUrl;
    } catch {
      thumbnailUrl = url; // fallback to original
    }

    return { url, thumbnailUrl };
  }

  // Fallback: data-URL for development
  const dataUrl = await fileToDataUrl(file);
  return { url: dataUrl, thumbnailUrl: dataUrl };
}

/**
 * Generate a thumbnail blob from an image file (client-side only).
 * Returns null if called on the server.
 */
export async function generateThumbnail(
  file: File
): Promise<Blob | null> {
  if (typeof window === "undefined") return null;

  const validation = validateFile(file);
  if (!validation.valid) return null;

  try {
    return await generateThumbnailFromFile(file);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error("ไม่สามารถอ่านไฟล์รูปภาพได้"));
    reader.readAsDataURL(file);
  });
}
