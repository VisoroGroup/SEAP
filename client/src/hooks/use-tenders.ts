import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type TenderInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useTenders(params?: { search?: string; location?: string; status?: string }) {
  const queryKey = [api.tenders.list.path, params?.search, params?.location, params?.status];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Filter out undefined/empty params to keep URL clean
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v != null && v !== "")
      );
      
      const url = `${api.tenders.list.path}?${new URLSearchParams(cleanParams as any).toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Közbeszerzések betöltése sikertelen");
      return api.tenders.list.responses[200].parse(await res.json());
    },
  });
}

export function useTender(id: number) {
  return useQuery({
    queryKey: [api.tenders.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.tenders.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Közbeszerzés betöltése sikertelen");
      }
      return api.tenders.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTender() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TenderInput) => {
      const res = await fetch(api.tenders.create.path, {
        method: api.tenders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Hiba történt a létrehozáskor");
      }
      return api.tenders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tenders.list.path] });
      toast({
        title: "Sikeres létrehozás",
        description: "Az új közbeszerzési eljárás rögzítésre került.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hiba",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
