import { Link } from "wouter";
import { type Tender } from "@shared/schema";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { Calendar, MapPin, Building, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface TenderCardProps {
  tender: Tender;
}

export function TenderCard({ tender }: TenderCardProps) {
  const statusColors = {
    open: "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200",
    closed: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200",
    awarded: "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200",
  };

  const statusLabels = {
    open: "Nyitott",
    closed: "Lezárt",
    awarded: "Odaítélt",
  };

  const formattedValue = new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: tender.currency,
    maximumFractionDigits: 0
  }).format(Number(tender.value));

  return (
    <Link href={`/tenders/${tender.id}`} className="block h-full group">
      <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden border-border/60 bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <Badge 
              variant="outline" 
              className={`${statusColors[tender.status as keyof typeof statusColors]} font-medium border px-2.5 py-0.5`}
            >
              {statusLabels[tender.status as keyof typeof statusLabels] || tender.status}
            </Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(tender.publicationDate || new Date()), "yyyy. MM. dd.", { locale: hu })}
            </span>
          </div>
          <h3 className="font-display font-semibold text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {tender.title}
          </h3>
        </CardHeader>
        <CardContent className="pb-4 space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Building className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
              <span className="line-clamp-1 font-medium text-foreground/80">{tender.authority}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0 text-primary/70" />
              <span>{tender.location}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-dashed">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Banknote className="w-4 h-4" />
              {formattedValue}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-4 text-xs text-muted-foreground">
           Határidő: <span className="text-foreground ml-1 font-medium">{format(new Date(tender.deadline), "yyyy. MM. dd.", { locale: hu })}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
