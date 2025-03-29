import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";
import { Worker } from "worker_threads";
import { createWriteStream as fsCreateWriteStream } from "fs";

interface CompleteRequest {
  hash: string;
  filename: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { hash, filename } = req.body as CompleteRequest;

    if (!hash || !filename) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    const result = await processUpload(hash, filename);
    res.json({
      success: true,
      totalRecords: result.totalRecords,
      jsonPath: result.jsonPath,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const workerPath = path.resolve("../../../workers/csv-processor.ts");

async function processUpload(hash: string, filename: string) {
  const tempDir = path.join(process.env.UPLOAD_DIR || "./uploads", hash);
  const finalPath = path.join(tempDir, "base.csv");
  const jsonPath = path.join(tempDir, `${filename}.json`);

  try {
    // Combinar chunks
    const chunks = await fs.readdir(tempDir);
    await combineChunks(chunks, tempDir, finalPath);

    // Procesar con worker
    const totalRecords = await processWithWorker(finalPath, jsonPath);

    // Limpiar
    await fs.rm(tempDir, { recursive: true, force: true });

    return { totalRecords, jsonPath };
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

async function combineChunks(
  chunks: string[],
  tempDir: string,
  finalPath: string
) {
  const writeStream = createWriteStream(finalPath);

  for (const chunk of chunks.sort(
    (a, b) => parseInt(a.split("-")[1]) - parseInt(b.split("-")[1])
  )) {
    const chunkPath = path.join(tempDir, chunk);
    const data = await fs.readFile(chunkPath);
    writeStream.write(data);
    await fs.unlink(chunkPath);
  }

  writeStream.end();
  await new Promise<void>((resolve) =>
    writeStream.on("finish", () => resolve())
  );
}

async function processWithWorker(csvPath: string, jsonPath: string) {
  return new Promise<number>((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: { filePath: csvPath },
    });

    const writeStream = createWriteStream(jsonPath);
    writeStream.write("[");

    worker.on("message", (message: any) => {
      if (message.type === "data") {
        writeStream.write(JSON.stringify(message.data) + ",");
      }
    });

    worker.on("exit", (code) => {
      writeStream.write("]");
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
      else resolve(0); // Assuming 0 records processed if no error
    });

    worker.on("error", reject);
  });
}

function createWriteStream(finalPath: string) {
  return fsCreateWriteStream(finalPath, { flags: "w" });
}
