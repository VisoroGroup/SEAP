import { useState } from "react";
import { useLocation } from "wouter";
import { useTenders } from "@/hooks/use-tenders";
import { TenderCard } from "@/components/TenderCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowRight, Building2, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [search, setSearch] = useState("");
  const [_, setLocation] = useLocation();
  const { data: tenders, isLoading } = useTenders();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/tenders?search=${encodeURIComponent(search)}`);
    } else {
      setLocation(`/tenders`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 to-primary/95"></div>
        
        <div className="container relative mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
              Átlátható Közbeszerzési Rendszer
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-blue-100 mb-10">
              Keressen aktív közbeszerzési eljárások között, kövesse nyomon a pályázatokat, és találja meg a megfelelő üzleti lehetőségeket egy helyen.
            </p>

            <form onSubmit={handleSearch} className="mx-auto max-w-3xl flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-xl shadow-2xl shadow-black/20">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Keresés kulcsszó, CPV kód vagy ajánlatkérő szerint..." 
                  className="pl-10 h-11 border-0 bg-transparent focus-visible:ring-0 text-base"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-[200px] border-t sm:border-t-0 sm:border-l border-gray-200">
                <Select>
                  <SelectTrigger className="h-11 border-0 bg-transparent focus:ring-0">
                    <SelectValue placeholder="Minden típus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Minden típus</SelectItem>
                    <SelectItem value="construction">Építési beruházás</SelectItem>
                    <SelectItem value="supply">Árubeszerzés</SelectItem>
                    <SelectItem value="service">Szolgáltatás</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="lg" className="h-11 px-8 text-base font-semibold shadow-none">
                Keresés
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border hover:border-primary/20 transition-colors">
              <div className="p-3 bg-blue-100 text-primary rounded-full">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">1,240+</p>
                <p className="text-sm text-muted-foreground">Aktív eljárás</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border hover:border-primary/20 transition-colors">
              <div className="p-3 bg-green-100 text-green-700 rounded-full">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">850 Mrd Ft</p>
                <p className="text-sm text-muted-foreground">Összérték idén</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border hover:border-primary/20 transition-colors">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-full">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">3,500+</p>
                <p className="text-sm text-muted-foreground">Regisztrált ajánlattevő</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Tenders */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-display font-bold text-foreground">Legfrissebb Kiírások</h2>
          <Button variant="outline" className="group" onClick={() => setLocation('/tenders')}>
            Összes megtekintése
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[280px] rounded-xl border bg-card p-6 space-y-4">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenders?.slice(0, 6).map((tender) => (
              <TenderCard key={tender.id} tender={tender} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
