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
    title: `${t(`districts.${report.district}`)}`,
    popup: report.description,
    status: report.status as 'new' | 'progress' | 'cleaned',
    photo: report.photos && report.photos.length > 0 ? report.photos[0] : undefined,
    timestamp: report.timestamp,
    district: t(`districts.${report.district}`),
    id: report.id
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
        <Card className="bg-white/60 backdrop-blur-md border-municipal-border/30 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 text-center">
              {t('publicMap')}
            </CardTitle>
            <p className="text-center text-municipal-gray">
              {t('publicMapDescription')}
            </p>
          </CardHeader>
        </Card>

        {/* Full-width Map */}
        <div className="flex justify-center">
          <Card className="bg-white/60 backdrop-blur-md border-municipal-border/30 shadow-lg w-full max-w-6xl">
            <CardContent className="p-0">
              {!isLoading && reports.length > 0 && (
                <MapView
                  latitude={centerLat}
                  longitude={centerLng}
                  zoom={12}
                  markers={mapMarkers}
                  className="h-96 lg:h-[700px] rounded-lg"
                />
              )}
              {isLoading && (
                <div className="h-96 lg:h-[700px] flex items-center justify-center bg-municipal-light rounded-lg">
                  <p className="text-municipal-gray">{t('loadingReports')}</p>
                </div>
              )}
              {!isLoading && reports.length === 0 && (
                <div className="h-96 lg:h-[700px] flex items-center justify-center bg-municipal-light rounded-lg">
                  <p className="text-municipal-gray">{t('noConfirmedReports')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="mt-6 flex justify-center">
          <Card className="bg-white/60 backdrop-blur-md border-municipal-border/30 shadow-lg w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 text-center">
                {t('statistics')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-municipal-gray">{t('verifiedOnMap')}</span>
                  <span className="text-sm font-medium text-gray-900">{reports.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-municipal-gray">{t('cleaned')}</span>
                  <span className="text-sm font-medium text-gray-500">{t('featureComingSoon')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-municipal-gray">{t('inProgress')}</span>
                  <span className="text-sm font-medium text-gray-500">{t('featureComingSoon')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <strong>{t('disclaimer.betaVersion')}</strong>
            </p>
            <p className="mb-2">
              {t('disclaimer.dataProcessing')}
            </p>
            <p className="mb-2">
              <strong>{t('disclaimer.feedback')}</strong>
            </p>
            <p>
              {t('disclaimer.copyright')}
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
    </div>
  );
}