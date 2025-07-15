import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportForm } from '@/components/ReportForm';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function PublicForm() {
  const { t } = useTranslation();
  const [showThankYou, setShowThankYou] = useState(false);

  const handleSubmitSuccess = () => {
    setShowThankYou(true);
    setTimeout(() => {
      setShowThankYou(false);
    }, 5000);
  };

  if (showThankYou) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-lg mx-auto bg-white/60 backdrop-blur-md border-municipal-border/30 shadow-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-20 w-20 text-municipal-green mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('thankYou')}</h3>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">{t('thankYouMessage')}</p>
            <div className="mt-6 p-4 bg-municipal-light rounded-lg">
              <p className="text-sm text-municipal-gray">
                💡 <span>{t('mapTrackingNotice', 'Voit seurata hyväksyttyjä ilmoituksia karttanäkymästä')}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 px-4 flex flex-col overflow-x-hidden" style={{ minHeight: '100vh', background: 'transparent' }}>
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-lg">
          <ReportForm onSubmitSuccess={handleSubmitSuccess} />
        </div>
      </div>
      {/* Language selector and footer */}
      <div className="mt-12 space-y-6">
        <div className="flex justify-center items-center px-4 py-4 bg-black/40 backdrop-blur-sm rounded-lg">
          <LanguageSelector />
        </div>
        
        {/* Disclaimer and beta notice */}
        <div className="px-4 py-3 bg-black/20 backdrop-blur-sm rounded-lg text-xs text-white/70 leading-relaxed">
          <p className="mb-2">
            <strong>{t('disclaimer.betaVersion')}</strong>
          </p>
          <p className="mb-2">
            {t('disclaimer.dataProcessing')}
          </p>
          <p className="mb-2">
            <strong>{t('disclaimer.feedback')}</strong>
          </p>
          <p className="mb-2">
            {t('disclaimer.copyright')}
          </p>
          <p className="text-center">
            <a href="/cookie-policy" className="text-white/90 hover:text-white underline">{t('cookiePolicy.link')}</a>
            {' | '}
            <a href="/privacy-policy" className="text-white/90 hover:text-white underline">{t('privacyPolicy.link')}</a>
          </p>
        </div>
        
        {/* Image copyright */}
        <div className="text-center">
          <div className="text-xs text-white/60 bg-black/30 backdrop-blur-sm rounded px-3 py-2 inline-block">
            Royalty-free Finnish forest lake landscape. Generated for Töhryvahti.
          </div>
        </div>
      </div>
    </div>
  );
}
