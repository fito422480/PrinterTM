"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import BackButton from "@/components/BackButton";
import posts from "@/data/posts"; // Importa tu data local o el servicio de fetch adecuado

// Define el esquema de validación usando zod
const formSchema = z.object({
  invoiceNumber: z.coerce
    .number()
    .min(1, { message: "Nº Documento es requerido" }),
  xmlData: z.string().min(1, { message: "El XML es requerido" }),
  date: z.string().min(1, { message: "La fecha es requerida" }),
  status: z.string().min(1, { message: "El estado es requerido" }),
});

interface PostEditPageProps {
  params: { id: string }; // Asegúrate de que esto coincida con cómo se pasa en Next.js (generalmente string)
}

const PostEditPage = ({ params }: PostEditPageProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    // Log para ver si el ID está siendo capturado correctamente
    console.log("Params ID:", params.id);

    // Asegúrate de que el ID sea del tipo correcto
    const id = Number(params.id);

    // Log para verificar el tipo de ID y los datos de posts
    console.log("ID convertido:", id);
    console.log("Posts disponibles:", posts);

    // Función para buscar el post por ID
    const fetchPost = () => {
      setLoading(true);

      // Busca el post por ID asegurando que coincidan los tipos
      const filteredPost = posts.find((p) => p.INVOICE_ID === id);

      if (filteredPost) {
        setPost(filteredPost);
        console.log("Post encontrado:", filteredPost);
      } else {
        console.error("Factura no encontrada!");
      }
      setLoading(false);
    };

    fetchPost();
  }, [params.id]);

  // Inicializar React Hook Form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: post?.D_NUM_DOC || "",
      xmlData: post?.XML_RECEIVED || "",
      date: post?.D_FE_EMI_DE || "",
      status: post?.STATUS || "",
    },
  });

  // Actualizar el formulario cuando los datos del post estén listos
  useEffect(() => {
    if (post) {
      form.reset({
        invoiceNumber: post.D_NUM_DOC,
        xmlData: post.XML_RECEIVED,
        date: post.D_FE_EMI_DE,
        status: post.STATUS,
      });
    }
  }, [post, form]);

  // Manejo del submit del formulario
  const handleSubmit = (data: any) => {
    const id = Number(params.id);
    const updatedPostIndex = posts.findIndex((p) => p.INVOICE_ID === id);
    if (updatedPostIndex !== -1) {
      posts[updatedPostIndex] = {
        ...posts[updatedPostIndex],
        D_NUM_DOC: data.invoiceNumber,
        XML_RECEIVED: data.xmlData,
        D_FE_EMI_DE: data.date,
        STATUS: data.status,
      };

      toast({
        title: "Documento actualizado",
        description: `El documento ${data.invoiceNumber} ha sido actualizado correctamente.`,
      });
      console.log("Datos actualizados:", posts[updatedPostIndex]);

      // Redireccionar después de la actualización si es necesario
      router.push("/posts");
    } else {
      console.error("Factura no encontrada para actualizar.");
    }
  };

  // Mostrar un mensaje de carga mientras se obtiene el post
  if (loading) {
    return <div>Cargando datos del documento...</div>;
  }

  // Mostrar un error si el post no se encuentra
  if (!post) {
    return <div>Error: Documento no encontrado.</div>;
  }

  // Renderizado del formulario
  return (
    <>
      <BackButton text="Atrás" link="/posts" />
      <h3 className="text-2xl mb-4">Editar Factura</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
                  Nº Documento
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="bg-slate-100 dark:bg-slate-500 border-0 focus-visible:ring-0 text-black dark:text-white focus-visible:ring-offset-0"
                    placeholder="Introduce el Nº de Documento"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="xmlData"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
                  XML
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="bg-slate-100 dark:bg-slate-500 border-0 focus-visible:ring-0 text-black dark:text-white focus-visible:ring-offset-0"
                    placeholder="Introduce los datos XML"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
                  Fecha Emisión
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-slate-100 dark:bg-slate-500 border-0 focus-visible:ring-0 text-black dark:text-white focus-visible:ring-offset-0"
                    placeholder="Introduce la Fecha de Emisión"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-white">
                  Estado
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-slate-100 dark:bg-slate-500 border-0 focus-visible:ring-0 text-black dark:text-white focus-visible:ring-offset-0"
                    placeholder="Introduce el Estado"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full dark:bg-slate-800 dark:text-white"
          >
            Actualizar Documento
          </Button>
        </form>
      </Form>
    </>
  );
};

export default PostEditPage;
