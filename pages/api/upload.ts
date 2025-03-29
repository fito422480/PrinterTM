import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";
import formidable from "formidable";
import { createWriteStream } from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

export const config = { api: { bodyParser: false } };

interface UploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  jsonPath?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== "POST")
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });

  try {
    const { hash, index } = req.query;

    if (!hash || typeof hash !== "string") {
      return res.status(400).json({ success: false, error: "Invalid hash" });
    }

    const tempDir = path.join(UPLOAD_DIR, hash);
    await fs.mkdir(tempDir, { recursive: true });

    const { files } = await parseForm(req, tempDir);
    const chunk = Array.isArray(files.chunk) ? files.chunk[0] : files.chunk;

    if (!chunk) {
      return res
        .status(400)
        .json({ success: false, error: "No chunk received" });
    }

    const finalPath = path.join(tempDir, `${hash}-${index}.part`);
    await fs.rename(chunk.filepath, finalPath);

    res.status(200).json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
}

async function parseForm(req: NextApiRequest, uploadDir: string) {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      const form = formidable({
        maxFileSize: MAX_FILE_SIZE,
        multiples: false,
        uploadDir,
        filename: (name, ext) => `${name}${ext}`,
      });

      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    }
  );
}

function handleError(res: NextApiResponse<UploadResponse>, error: unknown) {
  console.error("Upload error:", error);
  const message = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json({ success: false, error: message });
}
