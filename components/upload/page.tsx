"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function UploadCSV() {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      if (!target?.result) return;
      const csv = target.result.toString();
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<any>) => {
          if (result.data.length > 0) {
            setColumns(Object.keys(result.data[0]));
            setData(result.data);
          }
        },
      });
    };
    reader.readAsText(file);
  };

  const handleProcessData = async () => {
    if (data.length === 0) {
      setMessage("❌ No hay datos para procesar");
      return;
    }

    setLoading(true);
    setProgress(0);
    setMessage("");

    try {
      const batchSize = 50;
      const totalBatches = Math.ceil(data.length / batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        const batch = data.slice(i * batchSize, (i + 1) * batchSize);
        
        await fetch("/api/oracle-insert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: batch }),
        });

        // Calculo suavizado del progreso
        const newProgress = ((i + 1) / totalBatches) * 100;
        setProgress(newProgress);
      }

      setMessage("✅ Datos procesados con éxito");
    } catch (error) {
      setMessage("❌ Error al procesar los datos");
      setProgress(0);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <div className="flex gap-4 mb-4">
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
        />
        <Button 
          onClick={handleProcessData} 
          disabled={loading} 
          className="bg-primary text-white hover:bg-primary/90"
        >
          {loading ? (
            <span className="flex items-center">
              <span className="mr-2">🔄</span> Procesando...
            </span>
          ) : "Procesar"}
        </Button>
      </div>

      <div className="w-full max-w-md my-4">
        {progress > 0 && (
          <Progress value={progress} className="h-3 bg-gray-200">
            <div 
              className={`h-full bg-green-500 rounded-full transition-all duration-300 ease-out ${
                progress < 100 ? "striped-animation" : ""
              }`}
              style={{ width: `${progress}%` }}
            />
          </Progress>
        )}
      </div>

      <div className="min-h-6 mt-2 text-sm text-center">
        {loading && "⏳ Procesando datos..."}
        {message}
      </div>

      {data.length > 0 && (
        <div className="w-full overflow-x-auto mt-6">
          <Table className="shadow-lg rounded-lg overflow-hidden border">
            <TableCaption className="text-lg font-medium m-4">
              📋 Facturas Adjuntas ({data.length} registros)
            </TableCaption>
            <TableHeader className="bg-gradient-to-r from-primary to-primary/80">
              <TableRow>
                {columns.map((col, index) => (
                  <TableHead 
                    key={index} 
                    className="text-white font-bold text-center px-4 py-3"
                  >
                    {col.toUpperCase()}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow 
                  key={index} 
                  className="hover:bg-gray-50 even:bg-gray-100"
                >
                  {columns.map((col, i) => (
                    <TableCell 
                      key={i} 
                      className="text-center px-4 py-2 text-sm"
                    >
                      {row[col]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}