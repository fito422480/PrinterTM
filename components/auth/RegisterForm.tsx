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
  name: z.string().min(1, {
    message: "Name is required",
  }),
  email: z
    .string()
    .min(1, {
      message: "Email is required",
    })
    .email({
      message: "Please enter a valid email",
    }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  confirmPassword: z.string().min(1, {
    message: "Confirm Password is required",
  }),
});

const RegisterForm = () => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    router.push("/");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regístrese</CardTitle>
        <CardDescription>añade la siguiente información</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase text-xs font-bold text-black dark:text-black">
                    Nombre
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-secondary dark:bg-secondary border-1 focus-visible:ring-1 text-black dark:text-black focus-visible: ring-offset-1"
                      placeholder="Ingrese su nombre"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      className="bg-secondary dark:bg-secondary border-1 focus-visible:ring-1 text-black dark:text-black focus-visible: ring-offset-1"
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
                  <FormLabel className="uppercase text-xs font-bold text-black dark:text-black">
                    Contraseña
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-secondary dark:bg-secondary border-1 focus-visible:ring-1 text-black dark:text-black focus-visible: ring-offset-1"
                      placeholder="Ingrese su contraseña"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase text-xs font-bold text-black dark:text-black">
                    Confirmar Contraseña{" "}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="confirmPassword"
                      className="bg-secondary dark:bg-secondary border-1 focus-visible:ring-1 text-black dark:text-black focus-visible: ring-offset-1"
                      placeholder="Repita su contraseña"
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

export default RegisterForm;
