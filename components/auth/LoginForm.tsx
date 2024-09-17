"use client";

import BackButton from "@/components/BackButton";
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
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z
    .string()
    .min(1, {
      message: "Email requerido",
    })
    .email({
      message: "Ingrese un email valido",
    }),
  password: z.string().min(1, {
    message: "Contraseña requerida",
  }),
});

const LoginForm = () => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    router.push("/");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicio de Sesion</CardTitle>
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase text-xs font-bold text-black dark:text-black">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-secondary dark:secondary border-0 focus-visible:ring-0 text-black dark:text-white focus-visible: ring-offset-0"
                      placeholder="Ingrese su mail"
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
                  <FormLabel className="uppercase text-xs font-bold text-black dark:text-black">
                    Contraseña
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-secondary dark:bg-secondary border-0 focus-visible:ring-0 text-black dark:text-white focus-visible: ring-offset-0"
                      placeholder="ingrese su contraseña"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full">Acceder</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
