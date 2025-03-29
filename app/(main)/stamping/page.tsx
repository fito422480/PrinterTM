// app/(main)/stamping/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import BackButton from "@/components/BackButton";

// Definición del tipo para los timbrados
interface Timbrado {
  id: string;
  numero: string;
  tipo: "B2B" | "B2C";
  fechaEmision: string;
  fechaVencimiento: string;
  estado: "Activo" | "Vencido";
}

// Función para combinar clases condicionales (similar a classnames)
const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Datos de ejemplo
const timbradosIniciales: Timbrado[] = [
  {
    id: "1",
    numero: "12345678",
    tipo: "B2B",
    fechaEmision: "2025-01-15",
    fechaVencimiento: "2026-01-15",
    estado: "Activo",
  },
  {
    id: "2",
    numero: "87654321",
    tipo: "B2C",
    fechaEmision: "2024-10-20",
    fechaVencimiento: "2025-10-20",
    estado: "Activo",
  },
  {
    id: "3",
    numero: "56781234",
    tipo: "B2B",
    fechaEmision: "2024-05-10",
    fechaVencimiento: "2025-05-10",
    estado: "Vencido",
  },
  {
    id: "4",
    numero: "11223344",
    tipo: "B2C",
    fechaEmision: "2025-02-05",
    fechaVencimiento: "2026-02-05",
    estado: "Activo",
  },
  {
    id: "5",
    numero: "55667788",
    tipo: "B2B",
    fechaEmision: "2024-11-30",
    fechaVencimiento: "2025-11-30",
    estado: "Activo",
  },
  {
    id: "6",
    numero: "99001122",
    tipo: "B2C",
    fechaEmision: "2024-08-15",
    fechaVencimiento: "2025-08-15",
    estado: "Vencido",
  },
];

export default function TimbradosPage() {
  const [timbrados, setTimbrados] = useState<Timbrado[]>(timbradosIniciales);
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | "B2B" | "B2C">(
    "TODOS"
  );
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTimbrado, setEditingTimbrado] = useState<Timbrado | null>(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error",
  });

  // Límite de registros por página
  const limit = 5;

  // Estado para el formulario
  const [formData, setFormData] = useState({
    numero: "",
    tipo: "B2B" as "B2B" | "B2C",
    fechaEmision: "",
    fechaVencimiento: "",
    estado: "Activo" as "Activo" | "Vencido",
  });

  // Mostrar toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  // Manejar cambios en el formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Filtrar timbrados
  const timbradosFiltrados = timbrados.filter((timbrado) => {
    const coincideTipo = filtroTipo === "TODOS" || timbrado.tipo === filtroTipo;
    const coincideBusqueda =
      timbrado.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      timbrado.estado.toLowerCase().includes(busqueda.toLowerCase()) ||
      timbrado.fechaEmision.toLowerCase().includes(busqueda.toLowerCase()) ||
      timbrado.fechaVencimiento.toLowerCase().includes(busqueda.toLowerCase());

    return coincideTipo && coincideBusqueda;
  });

  // Ordenar timbrados por fecha de emisión (más reciente primero)
  const sortedTimbrados = [...timbradosFiltrados].sort(
    (a, b) =>
      new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime()
  );

  // Calcular total de páginas
  const totalPages = Math.ceil(sortedTimbrados.length / limit);

  // Obtener timbrados para la página actual
  const paginatedTimbrados = sortedTimbrados.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  // Cambiar de página
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Manejar envío del formulario de creación
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nuevoTimbrado: Timbrado = {
      id: (timbrados.length + 1).toString(),
      numero: formData.numero,
      tipo: formData.tipo,
      fechaEmision: formData.fechaEmision,
      fechaVencimiento: formData.fechaVencimiento,
      estado: "Activo",
    };

    setTimbrados([...timbrados, nuevoTimbrado]);
    setShowModal(false);
    setFormData({
      numero: "",
      tipo: "B2B",
      fechaEmision: "",
      fechaVencimiento: "",
      estado: "Activo",
    });

    showToast("Timbrado creado correctamente", "success");
  };

  // Abrir modal de edición
  const handleOpenEditModal = (timbrado: Timbrado) => {
    setEditingTimbrado(timbrado);
    setFormData({
      numero: timbrado.numero,
      tipo: timbrado.tipo,
      fechaEmision: timbrado.fechaEmision,
      fechaVencimiento: timbrado.fechaVencimiento,
      estado: timbrado.estado,
    });
    setShowEditModal(true);
  };

  // Manejar envío del formulario de edición
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTimbrado) return;

    const updatedTimbrados = timbrados.map((timbrado) => {
      if (timbrado.id === editingTimbrado.id) {
        return {
          ...timbrado,
          numero: formData.numero,
          tipo: formData.tipo,
          fechaEmision: formData.fechaEmision,
          fechaVencimiento: formData.fechaVencimiento,
          estado: formData.estado,
        };
      }
      return timbrado;
    });

    setTimbrados(updatedTimbrados);
    setShowEditModal(false);
    setEditingTimbrado(null);
    showToast("Timbrado actualizado correctamente", "success");
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Back Button */}
      <BackButton text="Atrás" link="/" />

      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold">Lista de Timbrados</h3>

          {/* Botón Nuevo Timbrado movido al lado del título */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Nuevo Timbrado
          </button>
        </div>

        {/* Controles de Filtro y Campo de Búsqueda */}
        <div className="flex flex-wrap items-center mb-4 space-x-2">
          <button
            onClick={() => setFiltroTipo("TODOS")}
            className={`px-4 py-2 ${
              filtroTipo === "TODOS" ? "bg-gray-300" : "bg-gray-100"
            } rounded`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroTipo("B2B")}
            className={`px-4 py-2 ${
              filtroTipo === "B2B" ? "bg-blue-300" : "bg-blue-100"
            } rounded`}
          >
            B2B
          </button>
          <button
            onClick={() => setFiltroTipo("B2C")}
            className={`px-4 py-2 ${
              filtroTipo === "B2C" ? "bg-green-300" : "bg-green-100"
            } rounded`}
          >
            B2C
          </button>

          {/* Campo de búsqueda */}
          <input
            type="search"
            placeholder="Buscar por número, estado o fecha"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-slate-50 px-4 py-2 border rounded flex-1"
          />
        </div>

        <div className="mb-4">
          <span className="text-sm text-gray-500">
            Mostrando {paginatedTimbrados.length} de {sortedTimbrados.length}{" "}
            registros
          </span>
        </div>

        {/* Tabla usando el componente Table */}
        <Table className="shadow-lg rounded-lg overflow-hidden">
          <TableCaption>Lista de timbrados recientes</TableCaption>
          <TableHeader>
            <TableRow className="bg-primary text-black dark:text-white">
              <TableHead>N° TIMBRADO</TableHead>
              <TableHead className="hidden md:table-cell">TIPO</TableHead>
              <TableHead className="hidden md:table-cell text-center">
                FECHA EMISIÓN
              </TableHead>
              <TableHead className="hidden md:table-cell text-center">
                FECHA VENCIMIENTO
              </TableHead>
              <TableHead className="hidden md:table-cell">ESTADO</TableHead>
              <TableHead className="text-center">ACTUALIZAR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTimbrados.length > 0 ? (
              paginatedTimbrados.map((timbrado, index) => (
                <TableRow
                  key={timbrado.id}
                  className={classNames(
                    "transition-shadow duration-200 hover:shadow-xl hover:bg-gray-50",
                    index % 2 === 0 ? "bg-gray-100" : "bg-white"
                  )}
                >
                  <TableCell>{timbrado.numero}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        timbrado.tipo === "B2B"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {timbrado.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-center hidden md:table-cell">
                    {timbrado.fechaEmision}
                  </TableCell>
                  <TableCell className="text-center hidden md:table-cell">
                    {timbrado.fechaVencimiento}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        timbrado.estado === "Activo"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {timbrado.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleOpenEditModal(timbrado)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xs"
                    >
                      Editar
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No se encontraron timbrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Controles de paginación */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-primary text-black dark:text-white rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span>
            Página {currentPage} de {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-4 py-2 bg-primary text-black dark:text-white rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal para crear nuevo timbrado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Registrar Nuevo Timbrado</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="uppercase text-xs font-bold text-black block mb-2">
                  Número de Timbrado
                </label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleInputChange}
                  placeholder="Ej: 12345678"
                  className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="uppercase text-xs font-bold text-black block mb-2">
                  Tipo
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                  required
                >
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="uppercase text-xs font-bold text-black block mb-2">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    name="fechaEmision"
                    value={formData.fechaEmision}
                    onChange={handleInputChange}
                    className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                    required
                  />
                </div>
                <div>
                  <label className="uppercase text-xs font-bold text-black block mb-2">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    name="fechaVencimiento"
                    value={formData.fechaVencimiento}
                    onChange={handleInputChange}
                    className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mr-2 px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar timbrado */}
      {showEditModal && editingTimbrado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Editar Timbrado</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="uppercase text-xs font-bold text-black block mb-2">
                  Número de Timbrado
                </label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleInputChange}
                  placeholder="Ej: 12345678"
                  className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="uppercase text-xs font-bold text-black block mb-2">
                  Tipo
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                  required
                >
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="uppercase text-xs font-bold text-black block mb-2">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    name="fechaEmision"
                    value={formData.fechaEmision}
                    onChange={handleInputChange}
                    className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                    required
                  />
                </div>
                <div>
                  <label className="uppercase text-xs font-bold text-black block mb-2">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    name="fechaVencimiento"
                    value={formData.fechaVencimiento}
                    onChange={handleInputChange}
                    className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="uppercase text-xs font-bold text-black block mb-2">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="bg-slate-100 border-0 focus:ring-0 w-full p-2 rounded text-black"
                  required
                >
                  <option value="Activo">Activo</option>
                  <option value="Vencido">Vencido</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="mr-2 px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast de notificación */}
      {toast.show && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-md ${
            toast.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
