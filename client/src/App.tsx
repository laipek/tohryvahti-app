import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { PaintbrushVertical } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import PublicForm from "@/pages/PublicForm";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/not-found";
import './lib/i18n';

function Header() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <PaintbrushVertical className="h-6 w-6 text-municipal-blue mr-3" />
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <div className="flex bg-municipal-border rounded-lg p-1">
              <Button
                variant={location === '/' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLocation('/')}
                className={location === '/' ? 'bg-municipal-blue text-white' : 'text-municipal-gray hover:text-municipal-blue'}
              >
                {t('report')}
              </Button>
              <Button
                variant={location === '/admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLocation('/admin')}
                className={location === '/admin' ? 'bg-municipal-blue text-white' : 'text-municipal-gray hover:text-municipal-blue'}
              >
                {t('admin')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={PublicForm} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen relative">
          <Header />
          <Router />
          
          {/* Image copyright notice */}
          <div className="image-copyright">
            Vehoniemenharju. Kuva: Lassi Välimaa<br />
            visitkangasala.fi
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
