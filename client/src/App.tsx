import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";

// Pages
import Home from "@/pages/Home";
import TenderList from "@/pages/TenderList";
import TenderDetail from "@/pages/TenderDetail";
import CreateTender from "@/pages/CreateTender";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/tenders" component={TenderList} />
          <Route path="/tenders/:id" component={TenderDetail} />
          <Route path="/create" component={CreateTender} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-white font-display text-lg font-bold mb-4">SEAP Elektronikus Közbeszerzés</h3>
              <p className="text-sm leading-relaxed max-w-sm">
                Magyarország vezető közbeszerzési portálja, amely biztosítja az átláthatóságot és a tisztességes versenyt minden gazdasági szereplő számára.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Információk</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Jogszabályok</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hirdetmények</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Statisztikák</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ügyfélszolgálat</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Kapcsolat</h4>
              <ul className="space-y-2 text-sm">
                <li>1055 Budapest, Kossuth Lajos tér 1-3.</li>
                <li>info@seap-kozbeszerzes.hu</li>
                <li>+36 (1) 123 4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-xs text-center text-slate-500">
            &copy; 2024 SEAP Közbeszerzési Rendszer. Minden jog fenntartva.
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
