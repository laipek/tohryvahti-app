import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportForm } from '@/components/ReportForm';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

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
      <div className="min-h-screen bg-municipal-light flex items-center justify-center px-4">
        <Card className="w-full max-w-md mx-auto">
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
    <div className="min-h-screen bg-municipal-light py-6 px-4">
      <ReportForm onSubmitSuccess={handleSubmitSuccess} />
    </div>
  );
}
