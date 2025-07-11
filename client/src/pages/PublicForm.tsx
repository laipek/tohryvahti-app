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
        <Card className="w-full max-w-md mx-auto bg-white/85 backdrop-blur-md border-municipal-border/50 shadow-lg">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-municipal-green mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('thankYou')}</h3>
            <p className="text-municipal-gray">{t('thankYouMessage')}</p>
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
      {/* Language selector and copyright */}
      <div className="mt-8 flex justify-between items-center px-4 py-4 bg-black/30 backdrop-blur-sm rounded-lg">
        <div className="text-xs leading-tight text-white">
          Vehoniemenharju. Kuva: Lassi Välimaa<br />
          visitkangasala.fi
        </div>
        <div className="flex items-center">
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
}
