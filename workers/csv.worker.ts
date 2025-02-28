import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { Worker } from "worker_threads";
import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileContent, fileName } = req.body;
    if (!fileContent || !fileName) {
      return res.status(400).json({ error: "Missing file data" });
    }

    const csvPath = path.join(uploadDir, fileName);
    await writeFileAsync(csvPath, fileContent);

    const jsonPath = await processWithWorker(csvPath);
    const jsonData = fs.readFileSync(jsonPath, "utf-8");
    await unlinkAsync(csvPath);
    await unlinkAsync(jsonPath);

    res.status(200).json({ data: JSON.parse(jsonData) });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Internal server error",
        details: (error as Error).message,
      });
  }
}

function processWithWorker(csvPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.join(process.cwd(), "workers", "csvWorker.js"),
      {
        workerData: { csvPath },
      }
    );

    worker.on("message", (jsonPath) => resolve(jsonPath));
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}
