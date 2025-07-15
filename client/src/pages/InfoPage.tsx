import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Target, BarChart3, Shield, Mail, Database } from 'lucide-react';

export default function InfoPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen px-4 py-8 relative">
      <div className="relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('infoPage.title')}
          </h1>
          <p className="text-lg text-gray-800 max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
            {t('infoPage.subtitle')}
          </p>
        </div>

        <div className="space-y-8">
          {/* What is Töhryvahti */}
          <Card className="bg-white/70 backdrop-blur-md border-municipal-border/40 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-municipal-blue rounded-full p-3 flex-shrink-0">
                  <Info className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {t('infoPage.whatIsTitle')}
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {t('infoPage.whatIsContent')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What can you do */}
          <Card className="bg-white/70 backdrop-blur-md border-municipal-border/40 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-municipal-green rounded-full p-3 flex-shrink-0">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {t('infoPage.whatCanDoTitle')}
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>{t('infoPage.reportEasily')}:</strong> {t('infoPage.reportEasilyDesc')}</p>
                    <p><strong>{t('infoPage.followOnMap')}:</strong> {t('infoPage.followOnMapDesc')}</p>
                    <p><strong>{t('infoPage.trackStatistics')}:</strong> {t('infoPage.trackStatisticsDesc')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How is data used */}
          <Card className="bg-white/70 backdrop-blur-md border-municipal-border/40 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-municipal-blue rounded-full p-3 flex-shrink-0">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {t('infoPage.dataUsageTitle')}
                  </h2>
                  <p className="text-gray-700 mb-3">
                    {t('infoPage.dataUsageIntro')}
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li>• {t('infoPage.budgetPlanning')}</li>
                    <li>• {t('infoPage.statisticalTracking')}</li>
                    <li>• {t('infoPage.serviceProviders')}</li>
                    <li>• {t('infoPage.residentInfluence')}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Is this official */}
          <Card className="bg-white/70 backdrop-blur-md border-municipal-border/40 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-gray-600 rounded-full p-3 flex-shrink-0">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {t('infoPage.officialServiceTitle')}
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {t('infoPage.officialServiceContent')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-white/70 backdrop-blur-md border-municipal-border/40 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-municipal-blue rounded-full p-3 flex-shrink-0">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {t('infoPage.contactTitle')}
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {t('infoPage.contactContent')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Copyright notice */}
          <div className="text-center mt-8">
            <div className="text-xs text-gray-600 bg-white/70 px-3 py-2 rounded backdrop-blur-sm inline-block">
              Vehoniemenharju. Kuva: visitkangasala.fi
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}