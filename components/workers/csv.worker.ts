import Papa from "papaparse";

interface CSVMessage {
  type: "PARSE_FILE";
  file: File;
}

interface CSVResult {
  data: any[];
  meta: any;
}

self.onmessage = function (e: MessageEvent<CSVMessage>) {
  if (e.data.type === "PARSE_FILE") {
    const file = e.data.file;

    Papa.parse(file, {
      delimiter: ",",
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      chunkSize: 1024 * 1024 * 5,
      chunk: (results: any) => {
        (self as any).postMessage({
          type: "CHUNK_READY",
          data: results.data,
          meta: {
            progress: (results.meta.cursor / file.size) * 100,
          },
        });
      },
      complete: () => (self as any).postMessage({ type: "COMPLETE" }),
      error: (err: any) =>
        (self as any).postMessage({
          type: "ERROR",
          error: err.message,
        }),
    });
  }
};
