"use client";

import { useState, useCallback } from "react";
import { parse } from "papaparse";
import type { ParseResult } from "papaparse";
import DataTable from "react-data-table-component";
import type { TableColumn } from "react-data-table-component";

type CsvRow = Record<string, string>;
type DataTableColumn = TableColumn<CsvRow>;

export default function UploadCSV() {
  const [data, setData] = useState<CsvRow[]>([]);
  const [columns, setColumns] = useState<DataTableColumn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = ({ target }) => {
        try {
          if (!target?.result) {
            throw new Error("Error al leer el archivo");
          }
          
          const csv = target.result.toString();
          parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (result: ParseResult<CsvRow>) => {
              if (result.errors.length > 0) {
                throw new Error(result.errors[0].message);
              }

              if (result.data.length > 0) {
                const keys = Object.keys(result.data[0]);
                const newColumns: DataTableColumn[] = keys.map((key) => ({
                  name: key.toUpperCase(),
                  selector: (row: CsvRow) => row[key],
                  sortable: true,
                  wrap: true,
                }));
                setColumns(newColumns);
                setData(result.data);
              }
              setIsLoading(false);
            },
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error desconocido");
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Error al leer el archivo");
        setIsLoading(false);
      };

      reader.readAsText(file);
    },
    []
  );

  return (
    <div className="flex flex-col items-center p-6 max-w-4xl mx-auto">
      <label className="flex flex-col items-center w-full mb-4">
        <span className="mb-2 text-lg font-medium">
          Upload CSV File
        </span>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={isLoading}
        />
      </label>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {isLoading && (
        <div className="mb-4 text-blue-600">Processing file...</div>
      )}

      {data.length > 0 && (
        <div className="w-full border rounded-lg overflow-hidden shadow-lg">
          <DataTable
            columns={columns}
            data={data}
            pagination
            striped
            highlightOnHover
            responsive
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50]}
            customStyles={{
              headCells: {
                style: {
                  fontWeight: "bold",
                  fontSize: "1rem",
                  backgroundColor: "#f8fafc",
                },
              },
              rows: {
                style: {
                  "&:not(:last-of-type)": {
                    borderBottom: "1px solid #e2e8f0",
                  },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}