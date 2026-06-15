import { IssueTicket } from "../types";

/**
 * Compresses an image data URL (base64 string) to fit under Firestore's document limits (max 250KB total size).
 */
export async function compressImage(base64Str: string, maxWidth = 600, maxHeight = 600, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio intact while bound sizing
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Triggers server-side Gemini Vision analysis on the uploaded photo.
 */
export async function analyzeIssueWithAI(
  base64Image: string,
  description: string
): Promise<{
  category: string;
  confidenceScore: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  severityScore: number;
  assignedDepartment: string;
  suggestedAction: string;
  complaintText: string;
}> {
  try {
    // Crucial safety measure: Compress the base64 photo before transmitting to the fullstack Express model
    const compressedImage = await compressImage(base64Image).catch((e) => {
      console.warn("Client side compression failed, using original size", e);
      return base64Image;
    });

    const response = await fetch("/api/gemini/analyze-issue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: compressedImage,
        description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Server could not process image details.");
    }

    return await response.json();
  } catch (error: any) {
    console.error("AI Analysis connection error:", error);
    throw error;
  }
}
