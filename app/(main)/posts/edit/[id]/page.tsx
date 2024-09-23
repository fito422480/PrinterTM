"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import xml2js from "xml2js";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
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
import posts from "@/data/posts";

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

    const fetchPost = () => {
      setLoading(true);
      const filteredPost = posts.find((p) => p.INVOICE_ID === id);
      if (filteredPost) {
        setPost(filteredPost);
      } else {
        console.error("Factura no encontrada!");
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
      invoiceNumber: post?.D_NUM_DOC || "",
      xmlData: post?.XML_RECEIVED || "",
      date: post?.D_FE_EMI_DE || "",
      status: post?.STATUS || "",
    },
  });

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

  // Submit del formulario
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

      router.push("/posts");
    } else {
      console.error("Factura no encontrada para actualizar.");
    }
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
