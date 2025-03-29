import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function processLargeCSV(filePath: string) {
  return new Promise((resolve, reject) => {
    const workerPath = path.join(
      __dirname,
      "../../PrinterTM/workers/csv.worker.ts"
    );

    const worker = new Worker(workerPath, {
      workerData: { filePath },
    });

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}
