"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import Papa, { ParseResult } from "papaparse";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z, ZodError } from "zod";

const DocumentoSchema = z.object({
  invoiceId: z.string(),
  traceId: z.string(),
  requestId: z.string(),
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
type ErrorValidacion = { doc: any; errors: string[] };

interface UploadCSVProps {
  title?: string;
  apiUrl?: string;
}

const PREVIEW_LIMIT = 1000000;
const ERROR_LIMIT = 5000;
const MAX_CONCURRENT_REQUESTS = 5;
const MAX_RETRIES = 3;

export default function UploadCSV({
  title,
  apiUrl = `${process.env.NEXT_PUBLIC_URL_BACKEND}`,
}: UploadCSVProps) {
  const [previewData, setPreviewData] = useState<Documento[]>([]);
  const [failedDocuments, setFailedDocuments] = useState<ErrorValidacion[]>([]);
  const [csvProgress, setCsvProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingToAPI, setIsUploadingToAPI] = useState(false);
  const [apiErrors, setApiErrors] = useState<
    Array<{ doc: Documento; error: string }>
  >([]);
  const [successCount, setSuccessCount] = useState(0);
  const [showApiErrorsDialog, setShowApiErrorsDialog] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Documento;
    direction: "ascending" | "descending";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const totalRows = useRef(0);
  const processedRows = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const countRows = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      let rowCount = 0;
      Papa.parse(file, {
        fastMode: true,
        header: true,
        skipEmptyLines: true,
        step: () => rowCount++,
        complete: () => resolve(rowCount),
        error: reject,
      });
    });
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".csv") && !file.name.endsWith(".tsv")) {
        alert("Solo se permiten archivos CSV o TSV.");
        return;
      }

      try {
        setIsParsing(true);
        setSelectedFile(file);
        setPreviewData([]);
        setFailedDocuments([]);
        setApiErrors([]);
        setCsvProgress(0);
        setSuccessCount(0);

        totalRows.current = await countRows(file);
        processedRows.current = 0;

        let preview: Documento[] = [];
        let failed: ErrorValidacion[] = [];

        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          worker: true,
          step: (row: ParseResult<any>) => {
            try {
              const parsed = DocumentoSchema.parse(row.data);
              if (preview.length < PREVIEW_LIMIT) preview.push(parsed);
            } catch (err) {
              if (err instanceof ZodError && failed.length < ERROR_LIMIT) {
                failed.push({
                  doc: row.data,
                  errors: err.issues.map(
                    (i) => `${i.path.join(".")}: ${i.message}`
                  ),
                });
              }
            }

            processedRows.current++;
            setCsvProgress(
              Math.round((processedRows.current / totalRows.current) * 100)
            );
          },
          complete: () => {
            setPreviewData(preview);
            setFailedDocuments(failed);
            setIsParsing(false);
            setCurrentPage(1); // Reset to first page when new data is loaded
          },
          error: (error) => {
            console.error("Error al procesar CSV:", error);
            setIsParsing(false);
            alert(`Error al procesar el archivo CSV: ${error.message}`);
          },
        });
      } catch (error) {
        console.error("Error al contar filas:", error);
        setIsParsing(false);
        if (error instanceof Error) {
          alert(`Error al contar las filas del archivo: ${error.message}`);
        } else {
          alert("Error al contar las filas del archivo.");
        }
      }
    },
    [countRows]
  );

  const processBatch = async (
    batch: Documento[],
    apiEndpoint: string
  ): Promise<number> => {
    abortController.current = new AbortController();

    const results = await Promise.allSettled(
      batch.map(async (doc) => {
        let retries = 0;
        while (retries < MAX_RETRIES) {
          try {
            const response = await fetch(apiEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "*/*",
              },
              body: JSON.stringify(doc),
              signal: abortController.current?.signal,
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              const errorMessage =
                errorData.message ||
                `Error: ${response.status} ${response.statusText}`;
              throw new Error(errorMessage);
            }

            return { success: true, doc };
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
              throw error;
            }

            retries++;
            if (retries >= MAX_RETRIES) {
              setApiErrors((prev) => [
                ...prev,
                {
                  doc,
                  error:
                    error instanceof Error
                      ? error.message
                      : `Error desconocido (intentos: ${MAX_RETRIES})`,
                },
              ]);
              return { success: false, doc };
            }

            await new Promise((resolve) =>
              setTimeout(resolve, 500 * Math.pow(2, retries))
            );
          }
        }
        return { success: false, doc };
      })
    );

    const successful = results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;

    return successful;
  };

  const handleUploadToAPI = useCallback(async () => {
    if (!previewData.length) return;

    setIsUploadingToAPI(true);
    setUploadProgress(0);
    setApiErrors([]);
    setSuccessCount(0);

    const totalDocs = previewData.length;
    let processedDocs = 0;

    try {
      for (let i = 0; i < previewData.length; i += MAX_CONCURRENT_REQUESTS) {
        const batch = previewData.slice(i, i + MAX_CONCURRENT_REQUESTS);
        const successful = await processBatch(batch, apiUrl);

        processedDocs += successful;
        setSuccessCount((prev) => prev + successful);
        setUploadProgress(Math.round((processedDocs / totalDocs) * 100));
      }
    } catch (error) {
      console.error("Error durante la carga de la API:", error);
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setApiErrors((prev) => [
          ...prev,
          {
            doc: { invoiceId: "global-error" } as Documento,
            error: error instanceof Error ? error.message : String(error),
          },
        ]);
      }
    } finally {
      setIsUploadingToAPI(false);

      if (apiErrors.length > 0) {
        setShowApiErrorsDialog(true);
      }
    }
  }, [previewData, apiUrl]);

  const cancelUpload = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setIsUploadingToAPI(false);
  }, []);

  const sortedData = useMemo(() => {
    let sortableData = [...previewData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [previewData, sortConfig]);

  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(filterText.toLowerCase())
      );
    });
  }, [sortedData, filterText]);

  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const currentRecords = filteredData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const requestSort = (key: keyof Documento) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const downloadFailedRecords = () => {
    const content = Papa.unparse(failedDocuments.map((item) => item.doc));
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registros_fallidos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {title || "Carga de Documentos"}
      </h1>

      <div className="mb-6 flex justify-center">
        <label className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded cursor-pointer inline-block">
          Seleccionar Archivo
          <input
            type="file"
            accept=".csv,.tsv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {selectedFile && (
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            Archivo: <span className="font-medium">{selectedFile.name}</span>(
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      )}

      <Dialog
        open={isParsing}
        onOpenChange={(open) => !open && setIsParsing(false)}
      >
        <DialogContent className="p-10">
          <DialogHeader>
            <DialogTitle>Procesando archivo CSV...</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-6 bg-gray-200 rounded-md overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300 ease-in-out progress-bar"
              style={{ width: `${csvProgress}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
              {csvProgress}% completado ({processedRows.current} de{" "}
              {totalRows.current} registros)
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isUploadingToAPI}
        onOpenChange={(open) => !open && cancelUpload()}
      >
        <DialogContent className="p-10">
          <DialogHeader>
            <DialogTitle>Procesando las Facturas...</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-6 bg-gray-200 rounded-md overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300 ease-in-out progress-bar"
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
              {uploadProgress}% completado ({successCount} de{" "}
              {previewData.length} registros)
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showApiErrorsDialog} onOpenChange={setShowApiErrorsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Errores de Envío</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] mt-4">
            <div className="space-y-2">
              {apiErrors.map((error, idx) => (
                <Alert variant="destructive" key={idx}>
                  <AlertDescription>
                    <span className="font-semibold">
                      {error.doc.invoiceId || "ID no disponible"}
                    </span>
                    : {error.error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setShowApiErrorsDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-center mb-6">
        <Button
          onClick={handleUploadToAPI}
          className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded"
          disabled={isUploadingToAPI || previewData.length === 0}
        >
          {isUploadingToAPI ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Procesar Facturas"
          )}
        </Button>
      </div>

      {successCount > 0 && !isUploadingToAPI && (
        <div className="mb-6">
          <Alert variant="default" className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Se procesaron correctamente {successCount} facturas.
              {apiErrors.length > 0 && ` Hubo ${apiErrors.length} errores.`}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="border rounded-lg shadow-md overflow-hidden mt-6">
          <div className="p-3 bg-gray-100 flex justify-between items-center">
            <p className="text-sm font-medium">
              Vista Previa ({previewData.length} registros)
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>
              <span className="px-2 py-1 text-sm">
                Página {currentPage} de {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <Table className="w-full border-collapse">
              <TableHeader className="bg-gray-50">
                <TableRow className="bg-primary text-black dark:text-white">
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => requestSort("invoiceId")}
                  >
                    ID{" "}
                    {sortConfig?.key === "invoiceId"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => requestSort("traceId")}
                  >
                    TRACEID{" "}
                    {sortConfig?.key === "traceId"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => requestSort("dNumTimb")}
                  >
                    TIMBRADO{" "}
                    {sortConfig?.key === "dNumTimb"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => requestSort("dEst")}
                  >
                    ESTABLECIMIENTO{" "}
                    {sortConfig?.key === "dEst"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => requestSort("dPunExp")}
                  >
                    PUNTO EXP.{" "}
                    {sortConfig?.key === "dPunExp"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => requestSort("dFeEmiDe")}
                  >
                    FECHA EMISIÓN{" "}
                    {sortConfig?.key === "dFeEmiDe"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => requestSort("xmlReceived")}
                  >
                    XML{" "}
                    {sortConfig?.key === "xmlReceived"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => requestSort("creationDate")}
                  >
                    FECHA CREACIÓN{" "}
                    {sortConfig?.key === "creationDate"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentRecords.map((row, index) => (
                  <TableRow
                    key={index}
                    className="border-b hover:bg-gray-100 transition-colors"
                  >
                    <TableCell className="px-4 py-2">{row.invoiceId}</TableCell>
                    <TableCell className="px-4 py-2">{row.traceId}</TableCell>
                    <TableCell className="px-4 py-2">{row.dNumTimb}</TableCell>
                    <TableCell className="px-4 py-2">{row.dEst}</TableCell>
                    <TableCell className="px-4 py-2">{row.dPunExp}</TableCell>
                    <TableCell className="px-4 py-2">{row.dFeEmiDe}</TableCell>
                    <TableCell className="px-4 py-2 max-w-[300px] truncate">
                      {row.xmlReceived}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {row.creationDate}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {failedDocuments.length > 0 && (
        <div className="border rounded-lg shadow-md mt-6">
          <div className="p-3 bg-red-100 flex justify-between items-center">
            <p className="text-sm font-medium text-red-800">
              Errores de Validación ({failedDocuments.length} registros)
            </p>
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={downloadFailedRecords}
            >
              Descargar registros fallidos
            </Button>
          </div>
          <ScrollArea className="h-[300px]">
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
                    <TableCell className="px-4 py-2 max-w-[300px] truncate">
                      {JSON.stringify(doc.doc)}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-red-600">
                      {doc.errors.join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
