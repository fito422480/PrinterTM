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

const PREVIEW_LIMIT = 1000000;
const ERROR_LIMIT = 50;
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB por fragmento

export default function UploadCSV({ title }: UploadCSVProps) {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [failedDocuments, setFailedDocuments] = useState<any[]>([]);
  const [csvProgress, setCsvProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingToAPI, setIsUploadingToAPI] = useState(false);

  const processedCount = useRef(0);
  const fileSize = useRef(1);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setPreviewData([]);
    setFailedDocuments([]);
    setCsvProgress(0);

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
        setCsvProgress(
          Math.min(
            100,
            Math.round(processedCount.current / (fileSize.current / 100000))
          )
        );
      },
      complete: () => {
        setPreviewData(preview);
        setFailedDocuments(failed);
        setIsParsing(false);
      },
      error: (error) => {
        console.error("Error al procesar CSV:", error);
        setIsParsing(false);
      },
    });
  };

  const createUploadWorker = () => {
    const code = `
      self.onmessage = async function(e) {
        const { file, chunkSize, uploadUrl } = e.data;
        const totalSize = file.size;
        let offset = 0;
        while (offset < totalSize) {
          const chunk = file.slice(offset, offset + chunkSize);
          const formData = new FormData();
          formData.append("chunk", chunk);
          formData.append("offset", offset.toString());
          try {
            const response = await fetch(uploadUrl, { method: "POST", body: formData });
            if (!response.ok) {
              self.postMessage({ error: "Error uploading chunk at offset " + offset });
              return;
            }
            offset += chunkSize;
            self.postMessage({ progress: Math.round((offset / totalSize) * 100) });
          } catch (err) {
            self.postMessage({ error: err.message });
            return;
          }
        }
        self.postMessage({ done: true });
      };
    `;
    const blob = new Blob([code], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));
    return worker;
  };

  const handleUploadToAPI = () => {
    if (!selectedFile) return;
    setIsUploadingToAPI(true);
    setUploadProgress(0);

    const uploadUrl = "https://your.api/upload";
    const worker = createUploadWorker();
    worker.postMessage({
      file: selectedFile,
      chunkSize: CHUNK_SIZE,
      uploadUrl,
    });

    worker.onmessage = (e) => {
      const data = e.data;
      if (data.progress !== undefined) {
        setUploadProgress(data.progress);
      }
      if (data.error) {
        console.error("Error en worker de subida:", data.error);
        setIsUploadingToAPI(false);
        worker.terminate();
      }
      if (data.done) {
        setUploadProgress(100);
        setIsUploadingToAPI(false);
        worker.terminate();
      }
    };
  };

  const totalPages = Math.ceil(previewData.length / recordsPerPage);

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const currentRecords = previewData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {title || "Carga de Documentos"}
      </h1>

      <div className="mb-6 flex justify-center">
        <label className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded cursor-pointer inline-block">
          Seleccionar Archivo CSV
          <input
            type="file"
            accept=".csv,.tsv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <Dialog open={isParsing}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Procesando archivo CSV...</DialogTitle>
          </DialogHeader>
          <div className="progress-bar-container relative">
            <div
              className="progress-bar-transition"
              style={{
                width: `${csvProgress}%`,
                height: "100%",
                borderRadius: "10px",
              }}
            ></div>
            <div className="progress-bar-text">Progreso: {csvProgress}%</div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadingToAPI}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Subiendo archivo a la API...</DialogTitle>
          </DialogHeader>
          <div className="progress-bar-container relative">
            <div
              className="progress-bar-transition"
              style={{
                width: `${uploadProgress}%`,
                height: "100%",
                borderRadius: "10px",
              }}
            ></div>
            <div className="progress-bar-text">Progreso: {uploadProgress}%</div>
          </div>
        </DialogContent>
      </Dialog>
      <Button
        onClick={handleUploadToAPI}
        className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded mt-6"
        disabled={isUploadingToAPI || !selectedFile}
      >
        Procesar las facturas
      </Button>

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
                <TableRow className="bg-primary text-black dark:text-white">
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
                {currentRecords.map((row, index) => (
                  <TableRow
                    key={index}
                    className="border-b hover:bg-gray-100 transition-all duration-300 ease-in-out"
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
                    <TableCell
                      className="px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ maxWidth: "300px" }}
                    >
                      {row.XML.length > 50
                        ? `${row.XML.substring(0, 50)}...`
                        : row.XML}
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

      {failedDocuments.length > 0 && (
        <div className="border rounded-lg shadow-md mt-6">
          <div className="p-3 bg-red-100">
            <p className="text-sm font-medium text-red-800">
              Errores ({failedDocuments.length} registros)
            </p>
          </div>
          <Table className="w-full border-collapse">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="px-4 py-2">Documento</TableHead>
                <TableHead className="px-4 py-2">Errores</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {failedDocuments.map((doc, idx) => (
                <TableRow key={idx} className="border-b">
                  <TableCell className="px-4 py-2">
                    {JSON.stringify(doc.doc)}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {doc.errors.join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
