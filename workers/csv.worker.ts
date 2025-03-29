// workers/csv.worker.ts
import { parentPort, workerData } from "worker_threads";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { z } from "zod";

const { csvPath } = workerData;

// Schema for validation
const DocumentoSchema = z.object({
  invoiceId: z.string(),
  traceId: z.string().uuid(),
  requestId: z.string().uuid(),
  customerId: z.string(),
  invoiceOrigin: z.string(),
  dNumTimb: z.string(),
  dEst: z.string(),
  dPunExp: z.string(),
  dNumDoc: z.string(),
  dFeEmiDe: z.string(),
  xmlReceived: z.string().trim(),
  creationDate: z.string(),
  status: z.string(),
});

type Documento = z.infer<typeof DocumentoSchema>;

async function processCSV() {
  try {
    const csvContent = fs.readFileSync(csvPath, "utf8");
    const results: Documento[] = [];
    const errors: any[] = [];

    // Parse CSV file
    return new Promise<string>((resolve, reject) => {
      interface ParsedResult {
        data: Record<string, any>;
      }

      interface ValidationError {
        row: Record<string, any>;
        errors: string[];
      }

      Papa.parse<ParsedResult>(csvContent, {
        header: true,
        skipEmptyLines: true,
        step: (result: ParsedResult) => {
          try {
            const parsedData: Documento = DocumentoSchema.parse(result.data);
            results.push(parsedData);
          } catch (error) {
            if (error instanceof z.ZodError) {
              errors.push({
                row: result.data,
                errors: error.issues.map(
                  (i) => `${i.path.join(".")}: ${i.message}`
                ),
              } as ValidationError);
            } else {
              errors.push({
                row: result.data,
                errors: ["Unknown validation error"],
              } as ValidationError);
            }
          }
        },
        complete: () => {
          // Write processed data to a temporary file
          const jsonPath: string = path.join(
            path.dirname(csvPath),
            `${path.basename(csvPath, path.extname(csvPath))}.json`
          );
          fs.writeFileSync(
            jsonPath,
            JSON.stringify({
              valid: results,
              errors: errors,
              totalValid: results.length,
              totalErrors: errors.length,
            })
          );
          resolve(jsonPath);
        },
        error: (error: Error) => {
          reject(new Error(`Error parsing CSV: ${error.message}`));
        },
      });
    });
  } catch (error) {
    throw new Error(
      `Worker error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Process the CSV and send the result back to the main thread
processCSV()
  .then((jsonPath) => {
    parentPort?.postMessage(jsonPath);
  })
  .catch((error) => {
    parentPort?.postMessage({ error: error.message });
  });
