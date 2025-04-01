"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Download, HelpCircle, Info, Loader2 } from "lucide-react";
import Papa, { ParseResult } from "papaparse";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z, ZodError } from "zod";

// 1. Agregar componente Toast para retroalimentación visual
const Toast = ({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white py-2 px-4 rounded-md shadow-lg z-50 flex items-center transition-opacity duration-300`}
      role="alert"
      aria-live="assertive"
    >
      <span className="mr-2">
        {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}
      </span>
      {message}
    </div>
  );
};

const DocumentoSchema = z.object({
  traceId: z.string(),
  requestId: z.string(),
  invoiceOrigin: z.string(),
  xmlReceived: z.string().trim(),
  status: z.string(),
});

// Estructura para la información del tipo de datos y su descripción
const fieldInfo = {
  traceId: {
    type: "String",
    description: "ID de seguimiento del proceso",
    ejemplo: "e77d7e31-cf8b-463b-bf13-4951ea85a899",
  },
  requestId: {
    type: "String",
    description: "ID de la solicitud",
    ejemplo: "e77d7e31-cf8b-463b-bf13-4951ea85a899",
  },
  invoiceOrigin: {
    type: "String",
    description: "Origen",
    ejemplo: "API_BATCH",
  },
  xmlReceived: {
    type: "String",
    description: "Contenido XML recibido (sin espacios al inicio o final)",
    ejemplo: "<rDE>	<DE></DE></rDE>",
  },
  status: {
    type: "String",
    description: "Estado del documento (PENDING)",
    ejemplo: "PENDING",
  },
};

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

const urlUpload = "/api/proxy/invoices";

// Información para los tooltips
const tooltips = {
  selectFile: "Seleccione un archivo CSV o TSV para procesar",
  downloadTemplate:
    "Descargue una plantilla con la estructura correcta para rellenar",
  help: "Vea información detallada sobre los campos y formatos requeridos",
  process: "Enviar las facturas al sistema para su procesamiento",
};

export default function UploadCSV({
  title,
  apiUrl = urlUpload,
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
  const [showTemplateInfoDialog, setShowTemplateInfoDialog] = useState(false);

  // 2. Estados para los tooltips
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // 3. Estado para mensajes toast
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    show: false,
    message: "",
    type: "success",
  });

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

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToast({
      show: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

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
        showToast("Solo se permiten archivos CSV o TSV.", "error");
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

            if (failed.length > 0) {
              showToast(
                `Archivo procesado con ${failed.length} errores de validación`,
                "info"
              );
            } else {
              showToast("Archivo procesado correctamente", "success");
            }
          },
          error: (error) => {
            console.error("Error al procesar CSV:", error);
            setIsParsing(false);
            showToast(
              `Error al procesar el archivo CSV: ${error.message}`,
              "error"
            );
          },
        });
      } catch (error) {
        console.error("Error al contar filas:", error);
        setIsParsing(false);
        if (error instanceof Error) {
          showToast(
            `Error al contar las filas del archivo: ${error.message}`,
            "error"
          );
        } else {
          showToast("Error al contar las filas del archivo.", "error");
        }
      }
    },
    [countRows]
  );

  const downloadTemplateCSV = () => {
    // Crear filas de ejemplo con datos de muestra
    const sampleData = [
      {
        traceId: "e77d7e31-cf8b-463b-bf13-4951ea85a899",
        requestId: "e77d7e31-cf8b-463b-bf13-4951ea85a899",
        invoiceOrigin: "API_BATCH",
        xmlReceived: "<rDE><DE></DE></rDE>",
        status: "PENDING",
      },
      {
        traceId: "56c9b01b-9e70-4aad-9e9d-378c9e347be8",
        requestId: "56c9b01b-9e70-4aad-9e9d-378c9e347be8",
        invoiceOrigin: "API_BATCH",
        xmlReceived: "<rDE><DE></DE></rDE>",
        status: "PENDING",
      },
    ];

    // Crear el CSV
    const csvContent = Papa.unparse(sampleData);

    // Añadir comentarios informativos al inicio del CSV
    const csvWithComments =
      "# Plantilla para carga de facturas\n" +
      "# Instrucciones:\n" +
      "# - Todos los campos son obligatorios\n" +
      "# - xmlReceived: contenido XML sin espacios al inicio o final\n" +
      "# - Para mas informacion, consulte la ayuda del sistema\n\n" +
      csvContent;

    // Crear y descargar el archivo
    const blob = new Blob([csvWithComments], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "base.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Mostrar mensaje de éxito
    showToast("Plantilla descargada correctamente", "success");
  };

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
            doc: { xmlReceived: "global-error" } as Documento,
            error: error instanceof Error ? error.message : String(error),
          },
        ]);
      }
    } finally {
      setIsUploadingToAPI(false);

      if (apiErrors.length > 0) {
        setShowApiErrorsDialog(true);
        showToast(
          `Procesamiento completado con ${apiErrors.length} errores`,
          "error"
        );
      } else if (successCount > 0) {
        showToast(
          `Se procesaron correctamente ${successCount} facturas`,
          "success"
        );
      }
    }
  }, [previewData, apiUrl]);

  const cancelUpload = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setIsUploadingToAPI(false);
    showToast("Procesamiento cancelado", "info");
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

    showToast("Registros fallidos descargados", "info");
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {title || "Carga de Documentos"}
      </h1>

      {/* Botones con mejoras: dimensiones consistentes, tooltips, transiciones */}
      <div className="mb-6 flex justify-center space-x-4">
        {/* Botón Seleccionar Archivo */}
        <div className="relative">
          <label
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded cursor-pointer inline-flex items-center justify-center min-w-[160px] transition-all duration-200 ease-in-out"
            onMouseEnter={() => setActiveTooltip("selectFile")}
            onMouseLeave={() => setActiveTooltip(null)}
            aria-label={tooltips.selectFile}
          >
            <span>Seleccionar Archivo</span>
            <input
              type="file"
              accept=".csv,.tsv"
              onChange={handleFileUpload}
              className="hidden"
              aria-hidden="true"
            />
          </label>
          {activeTooltip === "selectFile" && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
              {tooltips.selectFile}
            </div>
          )}
        </div>

        {/* Botón Descargar Plantilla */}
        <div className="relative">
          <button
            onClick={downloadTemplateCSV}
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded cursor-pointer inline-flex items-center justify-center min-w-[160px] transition-all duration-200 ease-in-out"
            onMouseEnter={() => setActiveTooltip("downloadTemplate")}
            onMouseLeave={() => setActiveTooltip(null)}
            aria-label={tooltips.downloadTemplate}
          >
            <Download className="mr-2 h-4 w-4" />
            <span>Descargar Plantilla</span>
          </button>
          {activeTooltip === "downloadTemplate" && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
              {tooltips.downloadTemplate}
            </div>
          )}
        </div>

        {/* Botón Ayuda */}
        <div className="relative">
          <button
            onClick={() => setShowTemplateInfoDialog(true)}
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded cursor-pointer inline-flex items-center justify-center min-w-[160px] transition-all duration-200 ease-in-out"
            onMouseEnter={() => setActiveTooltip("help")}
            onMouseLeave={() => setActiveTooltip(null)}
            aria-label={tooltips.help}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Ayuda</span>
          </button>
          {activeTooltip === "help" && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
              {tooltips.help}
            </div>
          )}
        </div>

        {/* Botón Procesar Facturas */}
        <div className="relative">
          <button
            onClick={handleUploadToAPI}
            className={`bg-primary text-white font-bold py-2 px-4 rounded cursor-pointer inline-flex items-center justify-center min-w-[160px] transition-all duration-200 ease-in-out ${
              isUploadingToAPI || previewData.length === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-secondary"
            }`}
            disabled={isUploadingToAPI || previewData.length === 0}
            onMouseEnter={() => setActiveTooltip("process")}
            onMouseLeave={() => setActiveTooltip(null)}
            aria-label={tooltips.process}
            aria-disabled={isUploadingToAPI || previewData.length === 0}
          >
            {isUploadingToAPI ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <span>Procesar Facturas</span>
            )}
          </button>
          {activeTooltip === "process" && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
              {tooltips.process}
            </div>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* Diálogo de información de la plantilla */}
      <Dialog
        open={showTemplateInfoDialog}
        onOpenChange={setShowTemplateInfoDialog}
      >
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              Información de la Plantilla CSV
            </DialogTitle>
            <DialogDescription className="mt-2">
              <p className="mb-2">
                Todos los campos son obligatorios para el correcto procesamiento
                de las facturas.
              </p>
              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  <span className="font-bold">Importante:</span> Asegúrese de
                  respetar los tipos de datos y formatos para evitar errores
                  durante la carga.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-2">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">
                Instrucciones de uso:
              </h3>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>
                  Descargue la plantilla base.csv haciendo clic en el botón
                  "Descargar Plantilla"
                </li>
                <li>
                  Complete los datos según el formato indicado en la tabla a
                  continuación
                </li>
                <li>No cambie el orden ni elimine ninguna columna</li>
                <li>
                  Guarde el archivo y súbalo utilizando el botón "Seleccionar
                  Archivo"
                </li>
                <li>
                  Verifique la vista previa antes de procesar las facturas
                </li>
              </ol>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold">Campo</TableHead>
                  <TableHead className="font-bold">Tipo de Dato</TableHead>
                  <TableHead className="font-bold">Descripción</TableHead>
                  <TableHead className="font-bold">Ejemplo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(fieldInfo).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell className="font-semibold text-blue-900">
                      {value.type}
                    </TableCell>
                    <TableCell>{value.description}</TableCell>
                    <TableCell className="text-gray-600 font-mono text-sm">
                      {value.ejemplo}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => setShowTemplateInfoDialog(false)}
              className="bg-primary hover:bg-secondary text-white font-bold transition-colors duration-200"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedFile && (
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 flex items-center justify-center">
            <Info className="mr-2 h-4 w-4 text-blue-500" />
            Archivo:{" "}
            <span className="font-medium ml-1">{selectedFile.name}</span> (
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      )}

      {/* Diálogo de progreso mejorado */}
      <Dialog
        open={isParsing}
        onOpenChange={(open) => !open && setIsParsing(false)}
      >
        <DialogContent className="p-10">
          <DialogHeader>
            <DialogTitle>Procesando archivo CSV...</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-8 bg-gray-200 rounded-md overflow-hidden mt-4">
            <div
              className="h-full bg-green-500 transition-all duration-300 ease-in-out"
              style={{ width: `${csvProgress}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
              {csvProgress}% completado ({processedRows.current} de{" "}
              {totalRows.current} registros)
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Por favor espere mientras se procesa el archivo...
          </p>
        </DialogContent>
      </Dialog>

      {/* Diálogo de carga a API mejorado */}
      <Dialog
        open={isUploadingToAPI}
        onOpenChange={(open) => !open && cancelUpload()}
      >
        <DialogContent className="p-10">
          <DialogHeader>
            <DialogTitle>Procesando las Facturas...</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-8 bg-gray-200 rounded-md overflow-hidden mt-4">
            <div
              className="h-full bg-green-500 transition-all duration-300 ease-in-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
              {uploadProgress}% completado ({successCount} de{" "}
              {previewData.length} registros)
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <Button
              onClick={cancelUpload}
              className="bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
              aria-label="Cancelar procesamiento"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de errores mejorado */}
      <Dialog open={showApiErrorsDialog} onOpenChange={setShowApiErrorsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-600 flex items-center">
              <span className="mr-2">⚠️</span> Errores de Envío
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] mt-4">
            <div className="space-y-2">
              {apiErrors.map((error, idx) => (
                <Alert
                  variant="destructive"
                  key={idx}
                  className="transition-all duration-200 hover:shadow-md"
                >
                  <AlertDescription>
                    <span className="font-semibold">
                      {error.doc.xmlReceived || "xmlReceived no disponible"}
                    </span>
                    : {error.error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => setShowApiErrorsDialog(false)}
              className="bg-primary hover:bg-secondary text-white font-bold transition-colors duration-200"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {successCount > 0 && !isUploadingToAPI && (
        <div className="mb-6">
          <Alert
            variant="default"
            className="bg-green-50 border-green-200 transition-all duration-300 animate-fadeIn"
          >
            <AlertDescription className="text-green-800 flex items-center">
              <span className="mr-2">✓</span>
              Se procesaron correctamente {successCount} facturas.
              {apiErrors.length > 0 && ` Hubo ${apiErrors.length} errores.`}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="border rounded-lg shadow-md overflow-hidden mt-6 transition-all duration-300">
          <div className="p-3 bg-gray-100 flex justify-between items-center">
            <p className="text-sm font-medium flex items-center">
              <span className="mr-2">📋</span>
              Vista Previa ({previewData.length} registros)
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="bg-white hover:bg-gray-100 transition-colors duration-200"
                aria-label="Página anterior"
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
                className="bg-white hover:bg-gray-100 transition-colors duration-200"
                aria-label="Página siguiente"
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
                    className="px-4 py-2 text-left cursor-pointer hover:bg-opacity-90 transition-colors duration-200"
                    onClick={() => requestSort("traceId")}
                    aria-label="Ordenar por TraceID"
                  >
                    TRACEID{" "}
                    {sortConfig?.key === "traceId"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer hover:bg-opacity-90 transition-colors duration-200"
                    onClick={() => requestSort("requestId")}
                    aria-label="Ordenar por RequestID"
                  >
                    REQUESTID{" "}
                    {sortConfig?.key === "requestId"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer hover:bg-opacity-90 transition-colors duration-200"
                    onClick={() => requestSort("invoiceOrigin")}
                    aria-label="Ordenar por Origen"
                  >
                    ORIGEN{" "}
                    {sortConfig?.key === "invoiceOrigin"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer hover:bg-opacity-90 transition-colors duration-200"
                    onClick={() => requestSort("xmlReceived")}
                    aria-label="Ordenar por XML"
                  >
                    XML{" "}
                    {sortConfig?.key === "xmlReceived"
                      ? sortConfig.direction === "ascending"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                  <TableHead
                    className="px-4 py-2 text-left cursor-pointer hover:bg-opacity-90 transition-colors duration-200"
                    onClick={() => requestSort("status")}
                    aria-label="Ordenar por Estado"
                  >
                    ESTADO{" "}
                    {sortConfig?.key === "status"
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
                    className="border-b hover:bg-gray-100 transition-colors duration-150"
                  >
                    <TableCell className="px-4 py-2">{row.traceId}</TableCell>
                    <TableCell className="px-4 py-2">{row.requestId}</TableCell>
                    <TableCell className="px-4 py-2">
                      {row.invoiceOrigin}
                    </TableCell>
                    <TableCell className="px-4 py-2 max-w-[300px] truncate">
                      {row.xmlReceived}
                    </TableCell>
                    <TableCell className="px-4 py-2">{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {failedDocuments.length > 0 && (
        <div className="border rounded-lg shadow-md mt-6 transition-all duration-300">
          <div className="p-3 bg-red-100 flex justify-between items-center">
            <p className="text-sm font-medium text-red-800 flex items-center">
              <span className="mr-2">⚠️</span>
              Errores de Validación ({failedDocuments.length} registros)
            </p>
            <button
              onClick={downloadFailedRecords}
              className="bg-primary hover:bg-secondary text-white font-bold py-1 px-3 rounded cursor-pointer inline-flex items-center transition-all duration-200"
              aria-label="Descargar registros fallidos"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar registros fallidos
            </button>
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
                  <TableRow
                    key={idx}
                    className="border-b hover:bg-red-50 transition-colors duration-150"
                  >
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

      {/* Agregar estilos CSS para animaciones */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
