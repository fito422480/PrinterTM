"use client"; // Asegúrate de que este componente se ejecute en el cliente

import { useRouter } from "next/navigation";
import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Esquema de validación del formulario
const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email requerido" })
    .email({ message: "Ingrese un email válido" }),
  password: z.string().min(1, { message: "Contraseña requerida" }),
});

const LoginForm = () => {
  const router = useRouter(); // Usado para redirigir
  const [loading, setLoading] = useState(false); // Estado de carga
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Estado para mostrar errores de autenticación

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Función para manejar el envío del formulario
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("https://apilogin-omega.vercel.app/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // Verificar si la respuesta es 200 (éxito)
      if (!response.ok) {
        throw new Error("Credenciales inválidas. Inténtalo de nuevo.");
      }

      const result = await response.json();

      // Puedes mostrar el mensaje de éxito al usuario
      console.log(result.message);

      // Si el login es exitoso, podrías guardar un estado de autenticación
      localStorage.setItem("isAuthenticated", "true");

      // Redirigir al usuario a la página principal
      router.push("/");
    } catch (error: any) {
      // Mostrar el error al usuario
      setErrorMessage(error.message || "Error desconocido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicio de Sesión</CardTitle>
        <CardDescription>
          Accede a tu cuenta con tus credenciales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {errorMessage && (
              <div className="text-red-500 text-sm">{errorMessage}</div>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase text-xs font-bold text-black">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-secondary border-0 focus-visible:ring-0 text-black"
                      placeholder="Ingrese su email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase text-xs font-bold text-black">
                    Contraseña
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-secondary border-0 focus-visible:ring-0 text-black"
                      placeholder="Ingrese su contraseña"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Accediendo..." : "Acceder"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
