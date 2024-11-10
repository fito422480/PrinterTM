"use client";

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

const formSchema = z.object({
  usuario: z.string().min(1, { message: "Usuario requerido" }),
  password: z.string().min(1, { message: "Contraseña requerida" }),
});

const LoginForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usuario: "",
      password: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: values.usuario,
          password: values.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Almacena el token en localStorage y redirige
        localStorage.setItem("accessToken", data.access_token);
        router.push("/");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message);
      }
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
        <CardDescription>Accede con tu cuenta de Keycloak</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="usuario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase text-xs font-bold text-black dark:text-black">
                    Usuario
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-secondary dark:bg-secondary border-1 focus-visible:ring-1 text-black dark:text-black focus-visible: ring-offset-1"
                      placeholder="Usuario de keycloak"
                      {...field}
                      type="text"
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
                  <FormLabel className="uppercase text-xs font-bold text-black dark:text-black">
                    Contraseña
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-secondary dark:bg-secondary border-1 focus-visible:ring-1 text-black dark:text-black focus-visible: ring-offset-1"
                      placeholder="Ingrese su contraseña"
                      {...field}
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {errorMessage && (
              <div className="text-red-500 text-sm">{errorMessage}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Accediendo..." : "Iniciar Sesión"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
