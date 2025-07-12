import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapView } from './MapView';
import { ReportModal } from './ReportModal';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Map, Table, Eye, Search, Filter, ArrowUpDown, AlertTriangle, Check, X, CircleAlert, Clock, Calendar } from 'lucide-react';
import type { GraffitiReport } from '@shared/schema';

export function AdminDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [validationFilter, setValidationFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'status' | 'district' | 'validated'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReport, setSelectedReport] = useState<GraffitiReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all reports for admin
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['/api/reports'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Verification mutations
  const approveReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      return apiRequest(`/api/reports/${reportId}/validate`, {
        method: 'PATCH',
        body: { validated: 'approved' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({ title: t('success'), description: t('reportApproved') });
    },
    onError: () => {
      toast({ title: t('error'), description: t('failedToApprove'), variant: 'destructive' });
    }
  });

  const rejectReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      return apiRequest(`/api/reports/${reportId}/validate`, {
        method: 'PATCH',
        body: { validated: 'rejected' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({ title: t('success'), description: t('reportRejected') });
    },
    onError: () => {
      toast({ title: t('error'), description: t('failedToReject'), variant: 'destructive' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: number; status: string }) => {
      return apiRequest(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({ title: t('success'), description: t('statusUpdated') });
    },
    onError: () => {
      toast({ title: t('error'), description: t('failedToUpdateStatus'), variant: 'destructive' });
    }
  });

  // Statistics
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.validated === 'pending').length,
    approved: reports.filter(r => r.validated === 'approved').length,
    rejected: reports.filter(r => r.validated === 'rejected').length,
    new: reports.filter(r => r.status === 'new').length,
    progress: reports.filter(r => r.status === 'progress').length,
    cleaned: reports.filter(r => r.status === 'cleaned').length,
    thisMonth: reports.filter(r => {
      const reportDate = new Date(r.timestamp);
      const now = new Date();
      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
    }).length
  };

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      if (statusFilter !== 'all' && report.status !== statusFilter) return false;
      if (validationFilter !== 'all' && report.validated !== validationFilter) return false;
      if (districtFilter !== 'all' && report.district !== districtFilter) return false;
      if (searchTerm && !report.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'district':
          comparison = a.district.localeCompare(b.district);
          break;
        case 'validated':
          comparison = a.validated.localeCompare(b.validated);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get unique districts for filter dropdown
  const districts = [...new Set(reports.map(r => r.district))];

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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
    const date = new Date(timestamp);
    return date.toLocaleString('fi-FI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Helsinki'
    });
  };

  const getValidationBadge = (validated: string) => {
    switch (validated) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />{t('pending')}</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />{t('approved')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />{t('rejected')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{validated}</Badge>;
    }
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
        </div>
      `,
      status: report.status as 'new' | 'progress' | 'cleaned',
      photo: report.photos && report.photos.length > 0 ? report.photos[0] : undefined,
      timestamp: report.timestamp,
      district: t('districts.' + report.district),
      id: report.id
    }));
  };

  const openReportModal = (report: GraffitiReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeReportModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
    // Refresh data when modal closes to show any updates
    queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
  };

  const handleReportUpdate = (updatedReport: GraffitiReport) => {
    // Update the report in the query cache
    queryClient.setQueryData(['/api/reports'], (oldData: GraffitiReport[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(report => 
        report.id === updatedReport.id ? updatedReport : report
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 lg:h-16">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">{t('adminPanel')}</h2>
            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600'} text-xs lg:text-sm px-2 lg:px-3`}
                >
                  <Table className="mr-1 h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">{t('table')}</span>
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className={`${viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-gray-600'} text-xs lg:text-sm px-2 lg:px-3`}
                >
                  <Map className="mr-1 h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">{t('map')}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
          <Card 
            className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setValidationFilter('all');
              setStatusFilter('all');
              setViewMode('table');
            }}
          >
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">{t('totalReports')}</p>
                  <p className="text-xl lg:text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <CircleAlert className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setValidationFilter('pending');
              setStatusFilter('all');
              setViewMode('table');
            }}
          >
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">{t('pendingApproval')}</p>
                  <p className="text-xl lg:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <AlertTriangle className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setValidationFilter('approved');
              setStatusFilter('all');
              setViewMode('table');
            }}
          >
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">{t('approved')}</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <Check className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setValidationFilter('rejected');
              setStatusFilter('all');
              setViewMode('table');
            }}
          >
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">{t('rejected')}</p>
                  <p className="text-xl lg:text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <X className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              {t('filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
              <div className="md:col-span-2 lg:col-span-1">
                <Input
                  placeholder={t('searchReports')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
              
              <Select value={validationFilter} onValueChange={setValidationFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={t('approvalStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="approved">{t('approved')}</SelectItem>
                  <SelectItem value="rejected">{t('rejected')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={t('workStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="new">{t('new')}</SelectItem>
                  <SelectItem value="progress">{t('progress')}</SelectItem>
                  <SelectItem value="cleaned">{t('cleaned')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={t('district')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allDistricts')}</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>
                      {t(`districts.${district}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setValidationFilter('all');
                  setStatusFilter('all');
                  setDistrictFilter('all');
                }}
                className="w-full text-sm"
                size="sm"
              >
                {t('clearFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{t('graffitiReports')} ({filteredReports.length})</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSort('timestamp')}
                    className="flex items-center"
                  >
                    {t('date')} <ArrowUpDown className="h-3 w-3 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSort('validated')}
                    className="flex items-center"
                  >
                    {t('validationStatus')} <ArrowUpDown className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">{t('loading')}</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">{t('noReportsFound')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('date')}
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('photo')}
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('district')}
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          {t('description')}
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('validationStatus')}
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          {t('status')}
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredReports.map((report) => (
                        <tr 
                          key={report.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openReportModal(report)}
                        >
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span className="font-medium">{formatDate(report.timestamp).split(' ')[0]}</span>
                              <span className="text-gray-500 text-xs">{formatDate(report.timestamp).split(' ')[1] || ''}</span>
                            </div>
                          </td>
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                            {report.photos && report.photos.length > 0 && (
                              <img 
                                src={report.photos[0]} 
                                alt="Report" 
                                className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg object-cover"
                              />
                            )}
                          </td>
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                            <div className="max-w-20 lg:max-w-none truncate">
                              {t(`districts.${report.district}`)}
                            </div>
                          </td>
                          <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-900 max-w-xs hidden md:table-cell">
                            <div className="truncate" title={report.description}>
                              {report.description}
                            </div>
                          </td>
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-1 lg:space-y-0 lg:space-x-2">
                              {getValidationBadge(report.validated)}
                              {report.validated === 'pending' && (
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      approveReportMutation.mutate(report.id);
                                    }}
                                    disabled={approveReportMutation.isPending}
                                    className="text-green-600 hover:text-green-700 border-green-200 h-6 w-6 p-0"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      rejectReportMutation.mutate(report.id);
                                    }}
                                    disabled={rejectReportMutation.isPending}
                                    className="text-red-600 hover:text-red-700 border-red-200 h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <Select 
                              value={report.status} 
                              onValueChange={(value) => updateStatusMutation.mutate({ reportId: report.id, status: value })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <SelectTrigger 
                                className="w-24 lg:w-32 h-8 text-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">{t('new')}</SelectItem>
                                <SelectItem value="progress">{t('progress')}</SelectItem>
                                <SelectItem value="cleaned">{t('cleaned')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReportModal(report);
                              }}
                              className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-0">
              {filteredReports.length > 0 ? (
                <MapView
                  latitude={61.2539}
                  longitude={24.0658}
                  zoom={12}
                  markers={getMapMarkers()}
                  className="h-96 rounded-lg"
                />
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  {t('noReportsToDisplay')}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={closeReportModal}
          onStatusUpdate={(status) => updateStatusMutation.mutate({ reportId: selectedReport.id, status })}
          onPropertyUpdate={handleReportUpdate}
        />
      )}
    </div>
  );
}