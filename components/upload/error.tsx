"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-4 bg-red-100 text-red-700">
      <h2>Error en el componente:</h2>
      <pre>{error.message}</pre>
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
      >
        Reintentar
      </button>
    </div>
  );
}
