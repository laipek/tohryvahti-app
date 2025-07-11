import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapView } from './MapView';
import { ReportModal } from './ReportModal';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Map, Table, Eye, Edit, CircleAlert, Clock, CheckCircle, Calendar } from 'lucide-react';
import type { GraffitiReport } from '@shared/schema';

export function AdminDashboard() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<GraffitiReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<GraffitiReport[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<GraffitiReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Statistics
  const stats = {
    new: reports.filter(r => r.status === 'new').length,
    progress: reports.filter(r => r.status === 'progress').length,
    cleaned: reports.filter(r => r.status === 'cleaned').length,
    thisMonth: reports.filter(r => {
      const reportDate = new Date(r.timestamp);
      const now = new Date();
      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
    }).length
  };

  useEffect(() => {
    const q = query(collection(db, 'graffiti-reports'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData: GraffitiReport[] = [];
      querySnapshot.forEach((doc) => {
        reportsData.push({ id: doc.id, ...doc.data() } as GraffitiReport);
      });
      reportsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setReports(reportsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = reports;
    if (statusFilter && statusFilter !== 'all') {
      filtered = reports.filter(report => report.status === statusFilter);
    }
    setFilteredReports(filtered);
  }, [reports, statusFilter]);

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'graffiti-reports', reportId), {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">{t('new')}</Badge>;
      case 'progress':
        return <Badge className="bg-yellow-100 text-yellow-800">{t('progress')}</Badge>;
      case 'cleaned':
        return <Badge className="bg-green-100 text-green-800">{t('cleaned')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: any) => {
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return date.toLocaleString();
  };

  const getMapMarkers = () => {
    return filteredReports.map(report => ({
      lat: report.latitude,
      lng: report.longitude,
      title: `${t('districts.' + report.district)} - ${formatDate(report.timestamp)}`,
      popup: `
        <div class="p-2">
          <h4 class="font-bold">${t('districts.' + report.district)}</h4>
          <p class="text-sm text-gray-600">${formatDate(report.timestamp)}</p>
          <p class="text-sm">${report.description.substring(0, 50)}...</p>
          <div class="mt-2">
            <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(report.status)}">${t(report.status)}</span>
          </div>
        </div>
      `,
      status: report.status as 'new' | 'progress' | 'cleaned',
      photo: report.photos && report.photos.length > 0 ? report.photos[0] : undefined,
      timestamp: report.timestamp,
      district: t('districts.' + report.district)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'progress': return 'bg-yellow-100 text-yellow-800';
      case 'cleaned': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openReportModal = (report: GraffitiReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Admin Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-municipal-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h2 className="text-xl font-bold text-gray-900">{t('adminPanel')}</h2>
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex bg-municipal-border rounded-lg p-1">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className={viewMode === 'map' ? 'bg-municipal-blue text-white' : 'text-municipal-gray'}
                >
                  <Map className="mr-1 h-4 w-4" />
                  {t('map')}
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-municipal-blue text-white' : 'text-municipal-gray'}
                >
                  <Table className="mr-1 h-4 w-4" />
                  {t('table')}
                </Button>
              </div>
              
              {/* Filter Controls */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 border-municipal-border">
                  <SelectValue placeholder={t('allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="new">{t('new')}</SelectItem>
                  <SelectItem value="progress">{t('progress')}</SelectItem>
                  <SelectItem value="cleaned">{t('cleaned')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white/60 backdrop-blur-md border-municipal-border/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-municipal-gray">{t('newReports')}</p>
                  <p className="text-2xl font-bold text-municipal-blue">{stats.new}</p>
                </div>
                <CircleAlert className="h-8 w-8 text-municipal-blue" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-md border-municipal-border/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-municipal-gray">{t('inProgress')}</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.progress}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-md border-municipal-border/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-municipal-gray">{t('cleaned')}</p>
                  <p className="text-2xl font-bold text-municipal-green">{stats.cleaned}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-municipal-green" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-md border-municipal-border/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-municipal-gray">{t('thisMonth')}</p>
                  <p className="text-2xl font-bold text-municipal-gray">{stats.thisMonth}</p>
                </div>
                <Calendar className="h-8 w-8 text-municipal-gray" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <Card className="bg-white/60 backdrop-blur-md border-municipal-border/30 shadow-lg">
            <CardContent className="p-0">
              {filteredReports.length > 0 ? (
                <MapView
                  latitude={60.1699}
                  longitude={24.9384}
                  zoom={12}
                  markers={getMapMarkers()}
                  className="h-96 rounded-lg"
                />
              ) : (
                <div className="h-96 flex items-center justify-center text-municipal-gray">
                  No reports to display
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className="bg-white/60 backdrop-blur-md border-municipal-border/30 shadow-lg">
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-municipal-border">
                <h3 className="text-lg font-medium text-gray-900">{t('graffitiReports')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-municipal-border">
                  <thead className="bg-municipal-light">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-municipal-gray uppercase tracking-wider">
                        {t('photo')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-municipal-gray uppercase tracking-wider">
                        {t('date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-municipal-gray uppercase tracking-wider">
                        {t('reportLocation')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-municipal-gray uppercase tracking-wider">
                        {t('district')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-municipal-gray uppercase tracking-wider">
                        {t('status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-municipal-gray uppercase tracking-wider">
                        {t('contactInfo')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-municipal-gray uppercase tracking-wider">
                        {t('propertyOwner')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-municipal-gray uppercase tracking-wider">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-municipal-border">
                    {filteredReports.map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.photos && report.photos.length > 0 && (
                            <img 
                              src={report.photos[0]} 
                              alt="Graffiti report" 
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(report.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {t(`districts.${report.district}`)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Select 
                            value={report.status} 
                            onValueChange={(value) => updateReportStatus(report.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">{t('new')}</SelectItem>
                              <SelectItem value="progress">{t('progress')}</SelectItem>
                              <SelectItem value="cleaned">{t('cleaned')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.name || report.email ? (
                            <div className="text-xs">
                              {report.name && <div className="font-medium">{report.name}</div>}
                              {report.email && <div className="text-gray-500">{report.email}</div>}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">{t('anonymous')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.propertyOwner ? (
                            <div className="text-xs">
                              <div className="font-medium">
                                {t(report.propertyOwner === 'ely-keskus' ? 'elyKeskus' : report.propertyOwner)}
                              </div>
                              {report.propertyDescription && (
                                <div className="text-gray-500 truncate max-w-32" title={report.propertyDescription}>
                                  {report.propertyDescription}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReportModal(report)}
                            className="text-municipal-blue hover:text-blue-700 mr-3"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-municipal-green hover:text-green-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReport(null);
          }}
          onStatusUpdate={(status) => updateReportStatus(selectedReport.id, status)}
          onPropertyUpdate={(updatedReport) => {
            setSelectedReport(updatedReport);
            // Force refresh to show updated property info in table
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }}
        />
      )}
    </div>
  );
}
