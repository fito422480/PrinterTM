"use client";

import { useState } from "react";
import { readString } from "papaparse";
import DataTable from "react-data-table-component";

export default function UploadCSV() {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      if (!target?.result) return;
      const csv = target.result.toString();
      readString(csv, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.data.length > 0) {
            const keys = Object.keys(result.data[0]);
            setColumns(keys.map((key) => ({ name: key, selector: (row: any) => row[key] })));
            setData(result.data);
          }
        },
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-center p-6">
      <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-4" />
      {data.length > 0 && (
        <DataTable columns={columns} data={data} pagination striped highlightOnHover />
      )}
    </div>
  );
}
