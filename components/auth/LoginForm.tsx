"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMsal } from "@azure/msal-react";
import { InteractionType } from "@azure/msal-browser";
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
  const router = useRouter();
  const { instance } = useMsal(); // Hooks de MSAL para manejar autenticación
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // Iniciar el proceso de autenticación con Azure AD
      await instance.loginPopup({
        scopes: ["User.Read"],
        prompt: "select_account", // Asegura que el usuario seleccione una cuenta
      });

      // Autenticación exitosa: establecer cookie para el middleware
      document.cookie = "isAuthenticated=true; path=/;";

      // También puedes guardar el estado en localStorage para otras verificaciones del lado del cliente
      localStorage.setItem("isAuthenticated", "true");

      // Redirigir al usuario a la página principal
      router.push("/");
    } catch (error: any) {
      setErrorMessage("Error de autenticación: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicio de Sesión</CardTitle>
        <CardDescription>Accede con tu cuenta de Azure AD</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)} // Eliminar el manejo del email/password ya que Azure AD lo maneja
            className="space-y-6"
          >
            {errorMessage && (
              <div className="text-red-500 text-sm">{errorMessage}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Accediendo..." : "Iniciar Sesión con Azure AD"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
