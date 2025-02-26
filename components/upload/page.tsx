"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
} from "@/components/ui/table";
import Papa from "papaparse";
import { z, ZodError } from "zod";

const DocumentoSchema = z.object({
  ID: z.string().uuid(),
  TRACEID: z.string().uuid(),
  TIMBRADO: z.coerce.number().int().positive(),
  ESTABLECIMIENTO: z.coerce.number().int().positive(),
  PUNTOEXPEDICION: z.coerce.number().int().positive(),
  FECHAEMISION: z.string().regex(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/),
  XML: z.string().trim(),
  FECHACREACION: z.string().regex(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/),
});

interface UploadCSVProps {
  title?: string;
}

const PREVIEW_LIMIT = 100;
const ERROR_LIMIT = 50;

export default function UploadCSV({ title }: UploadCSVProps) {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [failedDocuments, setFailedDocuments] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const processedCount = useRef(0);
  const fileSize = useRef(1);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setPreviewData([]);
    setFailedDocuments([]);
    setProgress(0);

    fileSize.current = file.size;
    processedCount.current = 0;

    let preview: any[] = [];
    let failed: any[] = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      step: (row) => {
        try {
          const parsed = DocumentoSchema.parse(row.data);
          processedCount.current++;
          if (preview.length < PREVIEW_LIMIT) preview.push(parsed);
        } catch (err) {
          if (err instanceof ZodError && failed.length < ERROR_LIMIT) {
            failed.push({
              doc: row.data,
              errors: err.issues.map((i) => i.message),
            });
          }
        }
        setProgress(
          Math.round((processedCount.current / fileSize.current) * 100)
        );
      },
      complete: () => {
        setPreviewData(preview);
        setFailedDocuments(failed);
        setIsUploading(false);
      },
      error: (error) => {
        console.error("Error al procesar CSV:", error);
        setIsUploading(false);
      },
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {title || "Carga de Documentos"}
      </h1>

      <div className="mb-6">
        <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer inline-block">
          Seleccionar Archivo CSV
          <input
            type="file"
            accept=".csv,.tsv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Dialogo de progreso */}
      <Dialog open={isUploading}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Procesando archivo...</DialogTitle>
          </DialogHeader>
          <Progress value={progress} className="w-full h-3" />
          <p className="text-sm text-gray-600 mt-2">Progreso: {progress}%</p>
        </DialogContent>
      </Dialog>

      {previewData.length > 0 && (
        <div className="border rounded-lg shadow-md overflow-hidden mt-6">
          <div className="p-3 bg-gray-100">
            <p className="text-sm font-medium">
              Vista Previa ({previewData.length} registros)
            </p>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <Table className="w-full border-collapse">
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b">
                  <TableHead className="px-4 py-2 text-left">ID</TableHead>
                  <TableHead className="px-4 py-2 text-left">TRACEID</TableHead>
                  <TableHead className="px-4 py-2 text-left">
                    TIMBRADO
                  </TableHead>
                  <TableHead className="px-4 py-2 text-left">
                    ESTABLECIMIENTO
                  </TableHead>
                  <TableHead className="px-4 py-2 text-left">
                    PUNTO EXP.
                  </TableHead>
                  <TableHead className="px-4 py-2 text-left">
                    FECHA EMISIÓN
                  </TableHead>
                  <TableHead className="px-4 py-2 text-left">XML</TableHead>
                  <TableHead className="px-4 py-2 text-left">
                    FECHA CREACIÓN
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow
                    key={index}
                    className="border-b hover:bg-gray-100 transition"
                  >
                    <TableCell className="px-4 py-2">{row.ID}</TableCell>
                    <TableCell className="px-4 py-2">{row.TRACEID}</TableCell>
                    <TableCell className="px-4 py-2">{row.TIMBRADO}</TableCell>
                    <TableCell className="px-4 py-2">
                      {row.ESTABLECIMIENTO}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {row.PUNTOEXPEDICION}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {row.FECHAEMISION}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {row.XML.substring(0, 50)}...
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {row.FECHACREACION}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
