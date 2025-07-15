import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function CookiePolicy() {
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
              {t('cookiePolicy.title')}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {t('cookiePolicy.lastUpdated')}: 14.7.2025
            </p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6 text-gray-700">
              
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('cookiePolicy.whatAreCookies')}
                </h2>
                <p>{t('cookiePolicy.cookiesDefinition')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('cookiePolicy.howWeUseCookies')}
                </h2>
                <p>{t('cookiePolicy.cookiesUsage')}</p>
                
                <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                  {t('cookiePolicy.essentialCookies')}
                </h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>i18nextLng:</strong> {t('cookiePolicy.languagePreference')}</li>
                  <li><strong>cookie_consent:</strong> {t('cookiePolicy.consentTracking')}</li>
                  <li><strong>sidebar_state:</strong> {t('cookiePolicy.adminInterface')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('cookiePolicy.thirdPartyCookies')}
                </h2>
                <p>{t('cookiePolicy.noThirdParty')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('cookiePolicy.manageCookies')}
                </h2>
                <p>{t('cookiePolicy.browserControls')}</p>
                <p className="mt-2">{t('cookiePolicy.clearCookies')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('cookiePolicy.yourRights')}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('cookiePolicy.rightToWithdraw')}</li>
                  <li>{t('cookiePolicy.rightToAccess')}</li>
                  <li>{t('cookiePolicy.rightToDelete')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('cookiePolicy.contact')}
                </h2>
                <p>
                  {t('cookiePolicy.contactInfo')} tuki(at)tohryvahti.fi
                </p>
              </section>

            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Copyright notice */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-600 bg-white/70 px-2 py-1 rounded backdrop-blur-sm">
        Kuva: Lassi Välimaa / visitkangasala.fi – Vehoniemenharju
      </div>
      </div>
    </div>
  );
}