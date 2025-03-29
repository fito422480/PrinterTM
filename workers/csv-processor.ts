import { parentPort, workerData } from "worker_threads";
import { createReadStream } from "fs";
import { Transform } from "stream";
import csv from "csv-parser";

interface CSVRow {
  [key: string]: string | number | boolean | null;
}

interface WorkerMessage {
  type: "progress" | "complete" | "error" | "columns";
  count?: number;
  batchSize?: number;
  columns?: string[];
  error?: string;
  data?: CSVRow[];
}

class CSVProcessor extends Transform {
  private rowCount = 0;
  private batch: CSVRow[] = [];
  private columns: Set<string> = new Set();
  private static BATCH_SIZE = 5000;

  constructor() {
    super({ objectMode: true });
  }

  public getRowCount(): number {
    return this.rowCount;
  }

  private sendMessage(message: WorkerMessage) {
    if (parentPort) {
      parentPort.postMessage(message);
    }
  }

  private processBatch() {
    if (this.batch.length === 0) return;

    this.sendMessage({
      type: "progress",
      count: this.rowCount,
      batchSize: this.batch.length,
    });

    this.batch = [];
  }

  _transform(
    row: Record<string, string>,
    encoding: BufferEncoding,
    callback: () => void
  ) {
    try {
      this.rowCount++;

      Object.keys(row).forEach((col) => this.columns.add(col.trim()));

      const processedRow: CSVRow = {};
      for (const [key, value] of Object.entries(row)) {
        const trimmedKey = key.trim();
        if (trimmedKey) {
          processedRow[trimmedKey] = this.parseValue(value);
        }
      }

      this.batch.push(processedRow);

      if (this.batch.length >= CSVProcessor.BATCH_SIZE) {
        this.processBatch();
      }

      if (this.rowCount === 1) {
        this.sendMessage({
          type: "columns",
          columns: Array.from(this.columns),
        });
      }

      callback();
    } catch (error) {
      this.emit("error", error);
    }
  }

  private parseValue(value: string | null): string | null {
    if (value === null || value.trim() === "") return null; // Maneja valores nulos y vacíos
    const lowerValue = value.toLowerCase();

    if (!isNaN(Number(value))) return String(value); // Convertimos a string para evitar errores de tipo
    if (lowerValue === "true" || lowerValue === "false") return lowerValue; // Convertimos booleanos a string

    return value;
  }

  _flush(callback: () => void) {
    this.processBatch();
    this.sendMessage({
      type: "columns",
      columns: Array.from(this.columns),
    });
    callback();
  }
}

async function processCSV(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const processor = new CSVProcessor();

    createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .pipe(processor)
      .on("finish", () => resolve(processor.getRowCount()))
      .on("error", reject);
  });
}

if (parentPort) {
  parentPort.on(
    "message",
    async (message: { type: string; filePath: string }) => {
      try {
        if (message.type !== "process") return;

        const totalRows = await processCSV(message.filePath);

        parentPort?.postMessage({
          type: "complete",
          count: totalRows,
        });
      } catch (error) {
        parentPort?.postMessage({
          type: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );
} else {
  console.error("Worker must be executed as a thread");
}
