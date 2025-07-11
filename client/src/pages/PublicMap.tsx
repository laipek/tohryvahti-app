import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapView } from '@/components/MapView';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Building } from 'lucide-react';
import type { GraffitiReport } from '@shared/schema';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function PublicMap() {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState<GraffitiReport | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['/api/reports/validated'],
    enabled: true
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fi-FI');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800';
      case 'progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cleaned':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const mapMarkers = reports.map((report: GraffitiReport) => ({
    lat: report.latitude,
    lng: report.longitude,
    title: `${t(`districts.${report.district}`)} - ${formatDate(report.timestamp)}`,
    popup: report.description.substring(0, 100) + '...',
    status: report.status as 'new' | 'progress' | 'cleaned'
  }));

  // Calculate center point from all reports
  const centerLat = reports.length > 0 
    ? reports.reduce((sum: number, r: GraffitiReport) => sum + r.latitude, 0) / reports.length
    : 61.2539; // Default to Kangasala area

  const centerLng = reports.length > 0
    ? reports.reduce((sum: number, r: GraffitiReport) => sum + r.longitude, 0) / reports.length
    : 24.0658;

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white/75 backdrop-blur-md border-municipal-border/30 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 text-center">
              {t('publicMap')}
            </CardTitle>
            <p className="text-center text-municipal-gray">
              {t('publicMapDescription')}
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="bg-white/75 backdrop-blur-md border-municipal-border/30 shadow-lg">
              <CardContent className="p-0">
                {!isLoading && reports.length > 0 && (
                  <MapView
                    latitude={centerLat}
                    longitude={centerLng}
                    zoom={12}
                    markers={mapMarkers}
                    className="h-96 lg:h-[600px] rounded-lg"
                    onClick={(lat, lng) => {
                      // Find closest report to clicked location
                      const closest = reports.reduce((prev: GraffitiReport, curr: GraffitiReport) => {
                        const prevDist = Math.sqrt(
                          Math.pow(prev.latitude - lat, 2) + Math.pow(prev.longitude - lng, 2)
                        );
                        const currDist = Math.sqrt(
                          Math.pow(curr.latitude - lat, 2) + Math.pow(curr.longitude - lng, 2)
                        );
                        return currDist < prevDist ? curr : prev;
                      });
                      setSelectedReport(closest);
                    }}
                  />
                )}
                {isLoading && (
                  <div className="h-96 lg:h-[600px] flex items-center justify-center bg-municipal-light rounded-lg">
                    <p className="text-municipal-gray">{t('loadingReports')}</p>
                  </div>
                )}
                {!isLoading && reports.length === 0 && (
                  <div className="h-96 lg:h-[600px] flex items-center justify-center bg-municipal-light rounded-lg">
                    <p className="text-municipal-gray">{t('noConfirmedReports')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Report Details Sidebar */}
          <div>
            <Card className="bg-white/75 backdrop-blur-md border-municipal-border/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {selectedReport ? t('reportDetails') : t('selectReportOnMap')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedReport ? (
                  <div className="space-y-4">
                    {selectedReport.photos && selectedReport.photos.length > 0 && (
                      <img
                        src={selectedReport.photos[0]}
                        alt="Graffiti report"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-municipal-gray" />
                      <span className="text-sm text-gray-900">
                        {formatDate(selectedReport.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-municipal-gray" />
                      <span className="text-sm text-gray-900">
                        {t(`districts.${selectedReport.district}`)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-municipal-gray" />
                      <span className="text-sm text-gray-900">
                        {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                      </span>
                    </div>
                    
                    <Badge className={getStatusColor(selectedReport.status)}>
                      {t(selectedReport.status)}
                    </Badge>
                    
                    <div>
                      <p className="text-sm font-medium text-municipal-gray mb-1">
                        {t('description')}
                      </p>
                      <p className="text-sm text-gray-900 bg-municipal-light p-2 rounded">
                        {selectedReport.description}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-municipal-gray">
                    {t('clickMapToSelect')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="bg-white/95 backdrop-blur-sm border-municipal-border shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {t('statistics')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-municipal-gray">{t('totalReports')}</span>
                    <span className="text-sm font-medium text-gray-900">{reports.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-municipal-gray">{t('cleaned')}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {reports.filter((r: GraffitiReport) => r.status === 'cleaned').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-municipal-gray">{t('inProgress')}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {reports.filter((r: GraffitiReport) => r.status === 'progress').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Language selector and footer */}
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center px-4 py-4 bg-black/40 backdrop-blur-sm rounded-lg">
            <div className="flex items-center">
              <LanguageSelector />
            </div>
          </div>
          
          {/* Disclaimer and beta notice */}
          <div className="px-4 py-3 bg-black/20 backdrop-blur-sm rounded-lg text-xs text-white/80 leading-relaxed">
            <p className="mb-2">
              <strong>BETA-versio:</strong> Töhryvahti on beta-vaiheessa oleva palvelu, jonka tarkoituksena on luoda viihtyisämpi ja töhrytön ympäristö kaikille kaupunkilaisille. Palvelu voi sisältää virheitä tai keskeytyä ilman ennakkoilmoitusta.
            </p>
            <p className="mb-2">
              Käyttämällä tätä palvelua hyväksyt, että ilmoittamasi tiedot ja lähettämäsi kuvien käyttöoikeuksiin annetaan lupa palvelun tarjoajalle ja käsittelyyn viihtyisyyden parantamiseksi ja töhryjen poistamiseksi. Kunnalla ei ole osuutta asiaan. Palvelu ei takaa välitöntä toimenpiteiden aloittamista.
            </p>
            <p>
              © 2025 Töhryvahti. Kaikki oikeudet pidätetään. Palvelun käyttö tapahtuu omalla vastuulla.
            </p>
          </div>
          
          {/* Image copyright */}
          <div className="text-center">
            <div className="text-xs text-white/60 bg-black/30 backdrop-blur-sm rounded px-3 py-2 inline-block">
              Vehoniemenharju. Kuva: Lassi Välimaa / visitkangasala.fi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}