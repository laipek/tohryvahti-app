import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen py-6 px-4 bg-[url('/vehoniemenharju.jpg')] bg-cover bg-center bg-no-repeat bg-fixed relative">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"></div>
      <div className="relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>{t('backToHome')}</span>
            </Button>
          </Link>
        </div>

        <Card className="bg-white/75 backdrop-blur-md border-municipal-border/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {t('privacyPolicy.title')}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {t('privacyPolicy.lastUpdated')}: 14.7.2025
            </p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6 text-gray-700">
              
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('privacyPolicy.dataController')}
                </h2>
                <p>{t('privacyPolicy.controllerInfo')}</p>
                <p className="mt-2">
                  <strong>{t('privacyPolicy.contact')}:</strong> tuki(at)tohryvahti.fi
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('privacyPolicy.dataWeCollect')}
                </h2>
                
                <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                  {t('privacyPolicy.reportData')}
                </h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacyPolicy.photos')}</li>
                  <li>{t('privacyPolicy.location')}</li>
                  <li>{t('privacyPolicy.description')}</li>
                  <li>{t('privacyPolicy.district')}</li>
                  <li>{t('privacyPolicy.contactInfo')}</li>
                  <li>{t('privacyPolicy.timestamp')}</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                  {t('privacyPolicy.technicalData')}
                </h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacyPolicy.languagePreference')}</li>
                  <li>{t('privacyPolicy.browserData')}</li>
                  <li>{t('privacyPolicy.sessionData')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('privacyPolicy.legalBasis')}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>{t('privacyPolicy.consent')}:</strong> {t('privacyPolicy.consentDescription')}</li>
                  <li><strong>{t('privacyPolicy.legitimateInterest')}:</strong> {t('privacyPolicy.legitimateDescription')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('privacyPolicy.howWeUseData')}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacyPolicy.usePublicMap')}</li>
                  <li>{t('privacyPolicy.useAdminManagement')}</li>
                  <li>{t('privacyPolicy.useContact')}</li>
                  <li>{t('privacyPolicy.useImprovement')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('privacyPolicy.dataSharing')}
                </h2>
                <p>{t('privacyPolicy.noSharing')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('privacyPolicy.dataRetention')}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacyPolicy.reportRetention')}</li>
                  <li>{t('privacyPolicy.imageRetention')}</li>
                  <li>{t('privacyPolicy.contactRetention')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('privacyPolicy.yourRights')}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>{t('privacyPolicy.rightAccess')}:</strong> {t('privacyPolicy.rightAccessDesc')}</li>
                  <li><strong>{t('privacyPolicy.rightRectification')}:</strong> {t('privacyPolicy.rightRectificationDesc')}</li>
                  <li><strong>{t('privacyPolicy.rightErasure')}:</strong> {t('privacyPolicy.rightErasureDesc')}</li>
                  <li><strong>{t('privacyPolicy.rightPortability')}:</strong> {t('privacyPolicy.rightPortabilityDesc')}</li>
                  <li><strong>{t('privacyPolicy.rightWithdraw')}:</strong> {t('privacyPolicy.rightWithdrawDesc')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('privacyPolicy.dataSecurity')}
                </h2>
                <p>{t('privacyPolicy.securityMeasures')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('privacyPolicy.changes')}
                </h2>
                <p>{t('privacyPolicy.policyChanges')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('privacyPolicy.complaints')}
                </h2>
                <p>
                  {t('privacyPolicy.complaintInfo')} <a href="https://tietosuoja.fi" target="_blank" rel="noopener noreferrer" className="text-municipal-blue hover:underline">tietosuoja.fi</a>
                </p>
              </section>

            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Copyright notice */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-600 bg-white/70 px-2 py-1 rounded backdrop-blur-sm">
        Vehoniemenharju. Kuva: visitkangasala.fi
      </div>
      </div>
    </div>
  );
}