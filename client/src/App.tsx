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
import { CookieConsent } from "@/components/CookieConsent";
import PublicForm from "@/pages/PublicForm";
import AdminPanel from "@/pages/AdminPanel";
import PublicMap from "@/pages/PublicMap";
import CookiePolicy from "@/pages/CookiePolicy";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import NotFound from "@/pages/not-found";
import './lib/i18n';

function Header() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex flex-col items-start min-w-0 flex-shrink">
            <div className="flex items-center">
              <PaintbrushVertical className="h-6 w-6 sm:h-8 sm:w-8 text-municipal-blue mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">Töhryvahti</h1>
            </div>
            <p className="text-xs sm:text-sm text-municipal-gray ml-8 sm:ml-11 -mt-1">Yhdessä siistimpi kaupunki</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="flex bg-municipal-border/70 backdrop-blur-sm rounded-lg p-0.5 sm:p-1">
              <Button
                variant={location === '/' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLocation('/')}
                className={`text-xs sm:text-sm px-1.5 sm:px-3 py-1 sm:py-2 h-auto ${location === '/' ? 'bg-municipal-blue text-white' : 'text-municipal-gray hover:text-municipal-blue'}`}
              >
                {t('report')}
              </Button>
              <Button
                variant={location === '/map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLocation('/map')}
                className={`text-xs sm:text-sm px-1.5 sm:px-3 py-1 sm:py-2 h-auto ${location === '/map' ? 'bg-municipal-blue text-white' : 'text-municipal-gray hover:text-municipal-blue'}`}
              >
                {t('map')}
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
      <Route path="/map" component={PublicMap} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
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
          <CookieConsent />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
