"use client";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import Link from "next/link";
import posts from "@/data/posts";
import classNames from "classnames";

interface PostsTableProps {
  limit?: number;
  title?: string;
}

const PostsTable = ({ limit, title }: PostsTableProps) => {
  // Estado para manejar el filtro de estado
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ERROR" | "OK">(
    "ALL"
  );

  // Ordenar los posts en orden descendente según la fecha
  const sortedPosts = [...posts].sort(
    (a, b) =>
      new Date(b.D_FE_EMI_DE).getTime() - new Date(a.D_FE_EMI_DE).getTime()
  );

  // Filtrar los posts según el estado seleccionado
  const filteredPosts = sortedPosts.filter((post) => {
    if (filterStatus === "ALL") return true;
    return post.RESULT_STATUS === filterStatus;
  });

  // Aplicar límite si se proporciona
  const limitedPosts = limit ? filteredPosts.slice(0, limit) : filteredPosts;

  return (
    <div className="mt-10">
      <h3 className="text-2xl mb-4 font-semibold">
        {title ? title : "Lista de Facturas"}
      </h3>

      {/* Controles de Filtro */}
      <div className="mb-4">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-4 py-2 mr-2 ${
            filterStatus === "ALL" ? "bg-gray-300" : "bg-gray-100"
          } rounded`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterStatus("ERROR")}
          className={`px-4 py-2 mr-2 ${
            filterStatus === "ERROR" ? "bg-red-300" : "bg-red-100"
          } rounded`}
        >
          Error
        </button>
        <button
          onClick={() => setFilterStatus("OK")}
          className={`px-4 py-2 ${
            filterStatus === "OK" ? "bg-green-300" : "bg-green-100"
          } rounded`}
        >
          OK
        </button>
      </div>

      <Table>
        <TableCaption>Lista de documentos recientes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>FACTURA</TableHead>
            <TableHead className="hidden md:table-cell">ESTADO</TableHead>
            <TableHead className="hidden md:table-cell text-center">
              FECHA
            </TableHead>
            <TableHead className="hidden md:table-cell text-center">
              Actualizar
            </TableHead>
            <TableHead className="hidden md:table-cell text-center">
              Reprocesar
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {limitedPosts.map((post, index) => (
            <TableRow
              key={post.INVOICE_ID}
              className={classNames({
                "bg-gray-100": index % 2 === 0,
                "bg-white": index % 2 !== 0,
              })}
            >
              <TableCell>{post.D_NUM_DOC}</TableCell>
              <TableCell className="hidden md:table-cell">
                {post.RESULT_STATUS}
              </TableCell>
              <TableCell className="text-center hidden md:table-cell">
                {post.D_FE_EMI_DE}
              </TableCell>
              <TableCell className="text-center">
                <Link href={`/posts/edit/${post.INVOICE_ID}`}>
                  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xs">
                    Editar
                  </button>
                </Link>
              </TableCell>
              <TableCell className="text-center">
                <Link href={`/posts/reprocess/${post.INVOICE_ID}`}>
                  <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-xs">
                    Enviar
                  </button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PostsTable;
