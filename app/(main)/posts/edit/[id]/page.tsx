"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import xml2js, { Builder } from "xml2js";
import * as z from "zod";

import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { fetchPosts as posts } from "@/data/posts";

// Esquema de validación usando zod
const formSchema = z.object({
  invoiceNumber: z.coerce
    .number()
    .min(1, { message: "Nº Documento es requerido" }),
  xmlData: z.string().min(1, { message: "El XML es requerido" }),
  date: z.string().min(1, { message: "La fecha es requerida" }),
  status: z.string().min(1, { message: "El estado es requerido" }),
});

interface PostEditPageProps {
  params: { id: string };
}

const PostEditPage = ({ params }: PostEditPageProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [xmlDataParsed, setXmlDataParsed] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Cargar factura
  useEffect(() => {
    const id = Number(params.id);

    const fetchPost = async () => {
      setLoading(true);
      try {
        const postsArray = await posts(); // Espera el resultado de fetchPosts
        const filteredPost = postsArray.find((p) => p.ID === id); // Usa .find en el arreglo resuelto
        if (filteredPost) {
          setPost(filteredPost);
        } else {
          console.error("Factura no encontrada!");
        }
      } catch (error) {
        console.error("Error al obtener las facturas:", error);
      }
      setLoading(false);
    };

    fetchPost();
  }, [params.id]);

  // Parsear XML
  useEffect(() => {
    if (post) {
      const parseXML = async () => {
        const parser = new xml2js.Parser();
        try {
          const result = await parser.parseStringPromise(post.XML_RECEIVED);
          setXmlDataParsed(result);
        } catch (err) {
          console.error("Error al parsear el XML:", err);
        }
      };
      parseXML();
    }
  }, [post]);

  // Inicializar formulario
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: post?.ID || "",
      invoiceNumber: post?.D_NUM_DOC || "",
      xmlData: post?.XML_RECEIVED || "",
      date: post?.D_FE_EMI_DE || "",
      status: post?.STATUS || "",
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        id: post.ID,
        invoiceNumber: post.D_NUM_DOC,
        xmlData: post.XML_RECEIVED,
        date: post.D_FE_EMI_DE,
        status: post.STATUS,
      });
    }
  }, [post, form]);

  // Submit del formulario
  const handleSubmit = async (data: any) => {
    const id = Number(params.id);

    // Espera a que fetchPosts se resuelva
    const postsArray = await posts();
    const updatedPostIndex = postsArray.findIndex((p) => p.ID === id);

    if (updatedPostIndex !== -1) {
      postsArray[updatedPostIndex] = {
        ...postsArray[updatedPostIndex],
        ID: data.ID,
        D_NUM_DOC: data.invoiceNumber,
        XML_RECEIVED: data.xmlData,
        STATUS: data.status,
      };

      toast({
        title: "Documento actualizado",
        description: `El documento ${data.invoiceNumber} ha sido actualizado correctamente.`,
      });

      router.push("/posts");
    } else {
      console.error("Factura no encontrada para actualizar.");
    }

    try {
      // Definir la URL del backend con la constante del entorno, con un fallback en localhost
      const apiUrl = `${process.env.NEXT_PUBLIC_URL_BACKEND}/${id}`; 

      // Configurar el cuerpo de la solicitud PUT
      const requestBody = JSON.stringify({
        xml_received: data.xmlData,
        id: data.id, // Enviar el XML actualizado
      });

      // Realizar la solicitud a la API
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      // Verificar si la respuesta fue exitosa
      if (response.ok) {
        const successMessage = `El documento ${data.invoiceNumber} ha sido actualizado correctamente.`;
        toast({
          title: "Documento actualizado",
          description: successMessage,
        });

        // Redirigir al usuario después de una actualización exitosa
        router.push("/posts");
      } else {
        // Procesar errores si la respuesta no es exitosa
        const errorData = await response.json();
        const errorMessage =
          errorData.message || "No se pudo actualizar el documento.";

        console.error("Error al actualizar el documento:", errorData);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Manejo de errores relacionados con la red o excepciones inesperadas
      const errorMessage =
        error.message ||
        "No se pudo conectar con el servidor. Inténtalo más tarde.";

      console.error("Error de red al actualizar el documento:", error);

      toast({
        title: "Error de conexión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Acciones que deben ejecutarse siempre, como limpiar estados
      console.log(
        "Finalizó la ejecución del intento de actualizar el documento."
      );
    }
  };

  //const builder = new xml2js.Builder();
  const builder = new Builder({
    headless: true, // Excluye el encabezado del XML
  });

  const minifyXml = (xmlString: string): string => {
    return xmlString.replace(/\s*(<[^>]+>)\s*/g, "$1"); // Elimina saltos de línea y espacios en blanco
  };
  // Modal para editar XML
  const handleXmlChange = (key: string, value: string) => {
    setXmlDataParsed((prev: any) => {
      // Clonar el objeto del XML para mantener inmutabilidad
      const updated = JSON.parse(JSON.stringify(prev));

      // Asegurar que rDE y DE existan
      const generalData = updated?.rDE?.DE?.[0]?.gDatGralOpe?.[0] || {};

      if (key === "dRucEm") {
        // Asegurar que gEmis exista
        generalData.gEmis = generalData.gEmis || [{}];
        generalData.gEmis[0].dRucEm = [value];
      } else if (key === "dNomRec") {
        // Asegurar que gDatRec exista
        generalData.gDatRec = generalData.gDatRec || [{}];
        generalData.gDatRec[0].dNomRec = [value];
      } else if (key === "dFeEmiDE") {
        generalData.dFeEmiDE = [value];
      }

      // Convierte el objeto actualizado a un string XML
      let updatedXmlString = builder.buildObject(updated);

      updatedXmlString = minifyXml(updatedXmlString);

      // Actualizar el campo de XML en el formulario
      form.setValue("xmlData", updatedXmlString);

      return updated;
    });
  };

  if (loading) return <div>Cargando datos del documento...</div>;
  if (!post) return <div>Error: Documento no encontrado.</div>;

  return (
    <>
      <BackButton text="Atrás" link="/posts" />
      <h3 className="text-2xl mb-4">Editar Documento</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase text-xs font-bold text-black dark:text-black">
                  Nº Documento
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="bg-slate-100 bg-secondary border-0 focus-visible:ring-0 text-black dark:text-black"
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase text-xs font-bold text-black dark:text-black">
                  Estado
                </FormLabel>
                <FormControl>
                  <Input
                    type="string"
                    className="bg-slate-100 bg-secondary border-0 focus-visible:ring-0 text-black dark:text-black"
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
                <FormLabel className="uppercase text-xs font-bold text-black dark:text-dark">
                  XML
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="bg-slate-100 bg-secondary border-0 focus-visible:ring-0 text-black dark:text-black"
                    placeholder="Introduce los datos XML"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            onClick={() => setIsDialogOpen(true)} // Abre el diálogo
            className="dark:bg-blue-1100 hover:secondary text-white font-bold py-2 px-4 rounded"
          >
            Editar XML
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <h2>Editar Campos del XML</h2>
              </DialogHeader>

              <div className="space-y-4">
                {/* Campos para editar el XML */}
                <FormItem>
                  <FormLabel>Fecha Emisión</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-slate-100 bg-secondary border-0 focus-visible:ring-0 text-black dark:text-black"
                      value={
                        xmlDataParsed?.rDE?.DE?.[0]?.gDatGralOpe?.[0]
                          ?.dFeEmiDE?.[0] || ""
                      }
                      onChange={(e) =>
                        handleXmlChange("dFeEmiDE", e.target.value)
                      }
                    />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel>RUC Emisor</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-slate-100 bg-secondary border-0 focus-visible:ring-0 text-black dark:text-black"
                      value={
                        xmlDataParsed?.rDE?.DE?.[0]?.gDatGralOpe?.[0]
                          ?.gEmis?.[0]?.dRucEm?.[0] || ""
                      }
                      onChange={(e) =>
                        handleXmlChange("dRucEm", e.target.value)
                      }
                    />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel>Nombre Cliente</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-slate-100 bg-secondary border-0 focus-visible:ring-0 text-black dark:text-black"
                      value={
                        xmlDataParsed?.rDE?.DE?.[0]?.gDatGralOpe?.[0]
                          ?.gDatRec?.[0]?.dNomRec?.[0] || ""
                      }
                      onChange={(e) =>
                        handleXmlChange("dNomRec", e.target.value)
                      }
                    />
                  </FormControl>
                </FormItem>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    toast({
                      title: "XML Actualizado",
                      description: "Los campos del XML han sido actualizados.",
                    });
                  }}
                  className="dark:bg-blue-1100 dark:text-white hover:secondary"
                >
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            type="submit"
            className="w-full dark:bg-blue-1100 dark:text-white"
          >
            Actualizar Documento
          </Button>
        </form>
      </Form>
    </>
  );
};

export default PostEditPage;
