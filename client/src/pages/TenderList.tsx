import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTenders } from "@/hooks/use-tenders";
import { TenderCard } from "@/components/TenderCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Filter, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function TenderList() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    status: searchParams.get("status") || "open",
  });

  const { data: tenders, isLoading } = useTenders(filters);

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      // Update URL silently usually, but here we just keep local state synced with hook
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({ search: "", location: "", status: "all" });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 space-y-6 shrink-0">
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6 sticky top-24">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg">Szűrők</h3>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                    Törlés
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <Label>Kulcsszó</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Keresés..." 
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Helyszín</Label>
                <Select value={filters.location} onValueChange={(val) => updateFilter("location", val === "all" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon megyét" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Országos</SelectItem>
                    <SelectItem value="Budapest">Budapest</SelectItem>
                    <SelectItem value="Pest">Pest megye</SelectItem>
                    <SelectItem value="Debrecen">Debrecen</SelectItem>
                    <SelectItem value="Szeged">Szeged</SelectItem>
                    <SelectItem value="Pécs">Pécs</SelectItem>
                    <SelectItem value="Győr">Győr</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Állapot</Label>
                <Select value={filters.status} onValueChange={(val) => updateFilter("status", val === "all" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon állapotot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Összes állapot</SelectItem>
                    <SelectItem value="open">Nyitott</SelectItem>
                    <SelectItem value="closed">Lezárt</SelectItem>
                    <SelectItem value="awarded">Odaítélt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full mt-4" onClick={() => {}}>
                Szűrés alkalmazása
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Közbeszerzési Eljárások</h1>
                <p className="text-muted-foreground mt-1">
                  {isLoading ? "Betöltés..." : `${tenders?.length || 0} találat a keresési feltételek alapján`}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                 <span className="text-sm text-muted-foreground">Rendezés:</span>
                 <Select defaultValue="newest">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Legfrissebb elől" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Legfrissebb elől</SelectItem>
                    <SelectItem value="value-desc">Érték (csökkenő)</SelectItem>
                    <SelectItem value="deadline-asc">Határidő (közelebbi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filters badges (mobile view mostly, or quick summary) */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.search && (
                  <Badge variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                    "{filters.search}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter("search", "")} />
                  </Badge>
                )}
                {filters.location && (
                  <Badge variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                    {filters.location}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter("location", "")} />
                  </Badge>
                )}
                {filters.status && filters.status !== "all" && (
                  <Badge variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                    {filters.status === "open" ? "Nyitott" : filters.status === "closed" ? "Lezárt" : "Odaítélt"}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter("status", "")} />
                  </Badge>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-40 rounded-xl border bg-card p-6 flex gap-4">
                    <div className="flex-1 space-y-4">
                       <Skeleton className="h-6 w-3/4" />
                       <Skeleton className="h-4 w-1/2" />
                       <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tenders && tenders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {tenders.map((tender) => (
                  <TenderCard key={tender.id} tender={tender} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Filter className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Nincs találat</h3>
                <p className="text-muted-foreground mt-1">Próbálja meg módosítani a szűrési feltételeket.</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Szűrők törlése
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
