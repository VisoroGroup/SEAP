import { useRoute } from "wouter";
import { useTender } from "@/hooks/use-tenders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Building, 
  Banknote, 
  FileText, 
  Share2, 
  Printer,
  Download
} from "lucide-react";
import { Link } from "wouter";

export default function TenderDetail() {
  const [match, params] = useRoute("/tenders/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: tender, isLoading, error } = useTender(id);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !tender) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold mb-2">A keresett eljárás nem található</h2>
        <p className="text-muted-foreground mb-6">Lehetséges, hogy törölték vagy érvénytelen az azonosító.</p>
        <Link href="/tenders">
          <Button>Vissza a listához</Button>
        </Link>
      </div>
    );
  }

  const formattedValue = new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: tender.currency,
    maximumFractionDigits: 0
  }).format(Number(tender.value));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 max-w-5xl flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Kezdőlap</Link>
          <span>/</span>
          <Link href="/tenders" className="hover:text-primary">Közbeszerzések</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{tender.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/tenders">
          <Button variant="ghost" size="sm" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza a listához
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
              <div className="flex items-start justify-between gap-4 mb-6">
                <Badge variant={tender.status === 'open' ? 'default' : 'secondary'} className="text-base px-3 py-1">
                  {tender.status === 'open' ? 'Nyitott eljárás' : tender.status === 'closed' ? 'Lezárt' : 'Odaítélt'}
                </Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" title="Nyomtatás">
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" title="Megosztás">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h1 className="text-3xl font-display font-bold text-foreground mb-4 leading-tight">
                {tender.title}
              </h1>

              <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Közzétéve: <span className="text-foreground font-medium">
                    {format(new Date(tender.publicationDate || new Date()), "yyyy. MMM dd.", { locale: hu })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Helyszín: <span className="text-foreground font-medium">{tender.location}</span>
                </div>
                {tender.cpvCode && (
                   <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CPV: <span className="text-foreground font-medium">{tender.cpvCode}</span>
                  </div>
                )}
              </div>

              <Separator className="my-8" />

              <div className="prose prose-slate max-w-none">
                <h3 className="text-lg font-bold text-foreground mb-4">A közbeszerzés tárgya és mennyisége</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {tender.description}
                </p>
                
                {/* Simulated Additional Content */}
                <h3 className="text-lg font-bold text-foreground mt-8 mb-4">Részvételi feltételek</h3>
                <ul className="text-muted-foreground list-disc pl-5 space-y-2">
                  <li>A gazdasági szereplőnek igazolnia kell, hogy nem áll a Kbt. 62. § (1) bekezdésében meghatározott kizáró okok hatálya alatt.</li>
                  <li>Az ajánlattevőnek rendelkeznie kell az elmúlt 3 évből származó referenciákkal.</li>
                  <li>Szakmai alkalmasság igazolása a megadott formanyomtatványokon.</li>
                </ul>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
              <h3 className="text-xl font-bold mb-6">Dokumentumok</h3>
              <div className="space-y-3">
                {['Ajánlattételi felhívás.pdf', 'Műszaki leírás.pdf', 'Szerződéstervezet.docx'].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">{doc}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      <Download className="w-4 h-4 mr-2" />
                      Letöltés
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ajánlatkérő</h3>
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-slate-100 rounded-lg">
                    <Building className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-tight">{tender.authority}</p>
                    <p className="text-sm text-muted-foreground mt-1">Hivatalos szerv</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Becsült Érték</h3>
                <div className="flex items-center gap-2 text-primary">
                  <Banknote className="w-5 h-5" />
                  <span className="text-2xl font-bold font-mono">{formattedValue}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ajánlattételi Határidő</h3>
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  <Calendar className="w-5 h-5" />
                  <span className="text-lg font-bold">{format(new Date(tender.deadline), "yyyy. MM. dd. HH:mm", { locale: hu })}</span>
                </div>
              </div>

              <Button className="w-full h-12 text-base shadow-lg shadow-primary/25 mt-4">
                Ajánlat benyújtása
              </Button>
            </div>

            <div className="bg-gradient-to-br from-primary to-primary/80 p-6 rounded-2xl shadow-lg text-white">
              <h3 className="font-bold text-lg mb-2">Segítségre van szüksége?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Ügyfélszolgálatunk munkanapokon 8:00 és 16:00 között áll rendelkezésére.
              </p>
              <Button variant="secondary" className="w-full text-primary font-semibold">
                Kapcsolatfelvétel
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
