import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTenderSchema, type InsertTender } from "@shared/schema";
import { useCreateTender } from "@/hooks/use-tenders";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { z } from "zod";

// Extend schema for form validation specifically (e.g., date coercion)
const formSchema = insertTenderSchema.extend({
  value: z.coerce.string().min(1, "Kötelező megadni"),
  deadline: z.coerce.date(),
});

export default function CreateTender() {
  const [_, setLocation] = useLocation();
  const { mutate, isPending } = useCreateTender();

  const form = useForm<InsertTender>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      authority: "",
      value: "0",
      currency: "HUF",
      location: "",
      cpvCode: "",
      status: "open",
    },
  });

  const onSubmit = (data: InsertTender) => {
    mutate(data, {
      onSuccess: () => {
        setLocation("/tenders");
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Új Közbeszerzés Kiírása</h1>
          <p className="text-muted-foreground mt-2">Töltse ki az űrlapot a nyilvános eljárás elindításához.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Alapadatok</CardTitle>
                <CardDescription>Az eljárás legfontosabb azonosító adatai.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eljárás megnevezése</FormLabel>
                      <FormControl>
                        <Input placeholder="Pl. Közúti felújítási munkálatok 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="authority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ajánlatkérő szervezet</FormLabel>
                        <FormControl>
                          <Input placeholder="Pl. Budapest Főváros Önkormányzata" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teljesítés helye</FormLabel>
                        <FormControl>
                          <Input placeholder="Pl. Budapest, V. kerület" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Részletek és Pénzügy</CardTitle>
                <CardDescription>A beszerzés tárgya, értéke és határideje.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Részletes leírás</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Írja le a beszerzés tárgyát, mennyiségét és műszaki paramétereit..." 
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Becsült érték</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pénznem</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Válasszon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HUF">HUF (Ft)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="cpvCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPV Kód (Opcionális)</FormLabel>
                        <FormControl>
                          <Input placeholder="Pl. 45000000-7" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ajánlattételi határidő</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/")}>Mégse</Button>
              <Button type="submit" size="lg" disabled={isPending} className="min-w-[150px]">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Közzététel...
                  </>
                ) : (
                  "Eljárás Közzététele"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
