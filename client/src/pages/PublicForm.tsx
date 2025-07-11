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
    <div className="min-h-screen py-4 px-4 flex flex-col overflow-x-hidden">
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-lg">
          <ReportForm onSubmitSuccess={handleSubmitSuccess} />
        </div>
      </div>
      {/* Language selector and footer */}
      <div className="mt-12 space-y-6">
        <div className="flex justify-between items-center px-4 py-4 bg-black/40 backdrop-blur-sm rounded-lg">
          <div className="flex items-center">
            <LanguageSelector />
          </div>
        </div>
        
        {/* Disclaimer and beta notice */}
        <div className="px-4 py-3 bg-black/20 backdrop-blur-sm rounded-lg text-xs text-white/70 leading-relaxed">
          <p className="mb-2">
            <strong>BETA-versio:</strong> Töhryvahti on avoin beta-vaiheessa oleva maksuton yleishyödyllinen palvelu, jonka tarkoituksena on mahdollistaa viihtyisämpi ja töhrytön ympäristö kaikille kaupunkilaisille. Palvelu voi sisältää virheitä tai keskeytyä ilman ennakkoilmoitusta.
          </p>
          <p className="mb-2">
            Käyttämällä tätä palvelua hyväksyt, että ilmoittamasi tiedot ja lähettämäsi kuvat käsitellään palvelun tarjoajan toimesta kaupungin viihtyisyyden parantamiseksi ja töhryjen poistamisen edistämiseksi. Kaikki ilmoitukset tarkistetaan ja asiattomat ilmoitukset poistetaan ilman ennakkoilmoitusta. Palvelu ei takaa välitöntä toimenpiteiden aloittamista.
          </p>
          <p>
            © 2025 Töhryvahti. Kaikki oikeudet pidätetään.
          </p>
        </div>
        
        {/* Image copyright */}
        <div className="text-center">
          <div className="text-xs text-white/60 bg-black/30 backdrop-blur-sm rounded px-3 py-2 inline-block">
            Kuva: Vehoniemenharju. visitkangasala.fi
          </div>
        </div>
      </div>
    </div>
  );
}
