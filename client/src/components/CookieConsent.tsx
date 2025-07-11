import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Cookie } from 'lucide-react';

export function CookieConsent() {
  const { t } = useTranslation();
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowConsent(false);
    // Clear any existing data
    localStorage.removeItem('i18nextLng');
    sessionStorage.clear();
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <Card className="bg-white/80 backdrop-blur-md border-municipal-border shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Cookie className="h-5 w-5 text-municipal-blue flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('cookieConsent.title')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('cookieConsent.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleAccept}
                  className="bg-municipal-blue hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {t('cookieConsent.accept')}
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="border-municipal-border"
                  size="sm"
                >
                  {t('cookieConsent.decline')}
                </Button>
              </div>
            </div>
            <Button
              onClick={handleDecline}
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}