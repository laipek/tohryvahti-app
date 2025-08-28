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
import { Map, Table, Eye, Search, Filter, ArrowUpDown, AlertTriangle, Check, X, CircleAlert, Clock, Calendar, Download, Upload, Plus, Trash2, BarChart3, Edit3, Square, CheckSquare, MinusSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const [sortBy, setSortBy] = useState<'timestamp' | 'status' | 'district' | 'validated' | 'id'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReport, setSelectedReport] = useState<GraffitiReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Bulk edit state
  const [selectedReports, setSelectedReports] = useState<Set<number>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    district: 'no-change',
    status: 'no-change',
    validated: 'no-change',
    ownership: 'no-change'
  });

  const [showAnalytics, setShowAnalytics] = useState(false);

  // Fetch all reports for admin
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['/api/reports'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Verification mutations
  const approveReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      return apiRequest('PATCH', `/api/reports/${reportId}/validate`, { validated: 'approved' });
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
      return apiRequest('PATCH', `/api/reports/${reportId}/validate`, { validated: 'rejected' });
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
      return apiRequest('PATCH', `/api/reports/${reportId}/status`, { status });
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
    total: (reports as GraffitiReport[]).length,
    pending: (reports as GraffitiReport[]).filter(r => r.validated === 'pending').length,
    approved: (reports as GraffitiReport[]).filter(r => r.validated === 'approved').length,
    rejected: (reports as GraffitiReport[]).filter(r => r.validated === 'rejected').length,
    new: (reports as GraffitiReport[]).filter(r => r.status === 'new').length,
    progress: (reports as GraffitiReport[]).filter(r => r.status === 'progress').length,
    cleaned: (reports as GraffitiReport[]).filter(r => r.status === 'cleaned').length,
    thisMonth: (reports as GraffitiReport[]).filter((r: GraffitiReport) => {
      const reportDate = new Date(r.timestamp);
      const now = new Date();
      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
    }).length
  };

  // Filter and sort reports
  const filteredReports = (reports as GraffitiReport[])
    .filter((report: GraffitiReport) => {
      if (statusFilter !== 'all' && report.status !== statusFilter) return false;
      if (validationFilter !== 'all' && report.validated !== validationFilter) return false;
      if (districtFilter !== 'all' && report.district !== districtFilter) return false;
      if (searchTerm && !report.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a: GraffitiReport, b: GraffitiReport) => {
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
        case 'id':
          comparison = a.id - b.id;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get unique districts for filter dropdown  
  const availableDistricts = Array.from(new Set((reports as GraffitiReport[]).map(r => r.district)));

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="h-3 w-3 ml-1 text-blue-600 rotate-180" /> : 
      <ArrowUpDown className="h-3 w-3 ml-1 text-blue-600" />;
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

  const exportReports = () => {
    const csvHeaders = ['ID', 'Timestamp', 'District', 'Status', 'Validated', 'Description', 'Name', 'Email', 'Property Owner', 'Latitude', 'Longitude'];
    const csvData = filteredReports.map(report => [
      report.id,
      formatDate(report.timestamp),
      t(`districts.${report.district}`),
      t(report.status),
      t(report.validated),
      `"${report.description.replace(/"/g, '""')}"`,
      report.name || '',
      report.email || '',
      report.propertyOwner || '',
      report.latitude,
      report.longitude
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tohryvahti-reports-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: t('exportSuccess'),
      description: t('exportSuccessMessage'),
    });
  };

  const deleteReport = async (reportId: number) => {
    if (!confirm(t('confirmDelete'))) return;
    
    try {
      await apiRequest('DELETE', `/api/reports/${reportId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: t('reportDeleted'),
        description: t('reportDeletedMessage'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('deleteError'),
        variant: 'destructive',
      });
    }
  };

  // Analytics data
  const analyticsData = (reports as GraffitiReport[]).reduce((acc: Record<string, number>, report: GraffitiReport) => {
    const date = new Date(report.timestamp).toLocaleDateString('fi-FI');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toLocaleDateString('fi-FI');
  }).reverse();

  const chartData = last30Days.map(date => ({
    date,
    reports: analyticsData[date] || 0
  }));

  // Districts list for bulk edit
  const districts = [
    'asema', 'haapaniemi', 'huutijarvi', 'ilkko', 'keskusta',
    'kuhmalahden_kirkonkyla', 'kuohenmaa', 'lahdenkulma', 'lamminrahka', 'lentola',
    'lihasula', 'pakkala', 'pohja', 'raikku', 'ranta_koivisto',
    'raudanmaa', 'riku', 'ruutana', 'saarenmaa', 'saarikylat',
    'sahalahti', 'suinula_haviseva', 'suorama', 'tiihala', 'vaaksy',
    'vatiala', 'vehkajarvi'
  ];

  // Bulk edit functions
  const toggleReportSelection = (reportId: number) => {
    const newSelection = new Set(selectedReports);
    if (newSelection.has(reportId)) {
      newSelection.delete(reportId);
    } else {
      newSelection.add(reportId);
    }
    setSelectedReports(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredReports.map((r: GraffitiReport) => r.id)));
    }
  };

  const clearSelection = () => {
    setSelectedReports(new Set());
    setShowBulkEdit(false);
    setBulkEditData({ district: 'no-change', status: 'no-change', validated: 'no-change', ownership: 'no-change' });
  };

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updateData: { reportIds: number[], updates: any }) => {
      return apiRequest('PATCH', '/api/reports/bulk-update', updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({ title: t('success'), description: t('bulkUpdateSuccess') });
      clearSelection();
    },
    onError: () => {
      toast({ title: t('error'), description: t('bulkUpdateFailed'), variant: 'destructive' });
    }
  });

  const handleBulkUpdate = () => {
    const updates: any = {};
    if (bulkEditData.district && bulkEditData.district !== 'no-change') {
      updates.district = bulkEditData.district;
    }
    if (bulkEditData.status && bulkEditData.status !== 'no-change') {
      updates.status = bulkEditData.status;
    }
    if (bulkEditData.validated && bulkEditData.validated !== 'no-change') {
      updates.validated = bulkEditData.validated;
    }
    if (bulkEditData.ownership && bulkEditData.ownership !== 'no-change') {
      updates.propertyOwner = bulkEditData.ownership; // Note: backend expects 'propertyOwner'
    }

    if (Object.keys(updates).length === 0) {
      toast({ title: t('error'), description: t('selectFieldsToUpdate'), variant: 'destructive' });
      return;
    }

    bulkUpdateMutation.mutate({
      reportIds: Array.from(selectedReports),
      updates
    });
  };

  // Enhanced toolbar component
  const AdminToolbar = () => (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-background/80 backdrop-blur-sm rounded-lg border">
      <div className="flex items-center gap-2">
        <Button onClick={exportReports} size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('exportReports')}
        </Button>
        <Button size="sm" variant="outline" disabled>
          <Upload className="h-4 w-4 mr-2" />
          {t('importReports')}
        </Button>
        <Button size="sm" variant="outline" disabled>
          <Plus className="h-4 w-4 mr-2" />
          {t('addReport')}
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant={showAnalytics ? "default" : "outline"}
          size="sm"
          onClick={() => setShowAnalytics(!showAnalytics)}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {t('analytics')}
        </Button>
        
        {selectedReports.size > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowBulkEdit(!showBulkEdit)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {t('bulkEdit')} ({selectedReports.size})
          </Button>
        )}
      </div>
    </div>
  );

  // Analytics component
  const AnalyticsView = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('dailyReports')} - {t('last30Days')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="reports" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

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
        {/* Enhanced Admin Toolbar */}
        <AdminToolbar />
        
        {/* Analytics View */}
        {showAnalytics && <AnalyticsView />}
        
        {/* Bulk Edit Panel */}
        {showBulkEdit && selectedReports.size > 0 && (
          <Card className="mb-6 border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  {t('bulkEditReports')} ({selectedReports.size} {t('selected')})
                </div>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  {t('cancel')}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('district')}</label>
                  <Select value={bulkEditData.district} onValueChange={(value) => setBulkEditData(prev => ({...prev, district: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectDistrict')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">{t('noChange')}</SelectItem>
                      {districts.map(district => (
                        <SelectItem key={district} value={district}>
                          {t(`districts.${district}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('status')}</label>
                  <Select value={bulkEditData.status} onValueChange={(value) => setBulkEditData(prev => ({...prev, status: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">{t('noChange')}</SelectItem>
                      <SelectItem value="new">{t('new')}</SelectItem>
                      <SelectItem value="progress">{t('progress')}</SelectItem>
                      <SelectItem value="cleaned">{t('cleaned')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('validationStatus')}</label>
                  <Select value={bulkEditData.validated} onValueChange={(value) => setBulkEditData(prev => ({...prev, validated: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectValidation')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">{t('noChange')}</SelectItem>
                      <SelectItem value="approved">{t('approved')}</SelectItem>
                      <SelectItem value="rejected">{t('rejected')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('ownership')}</label>
                  <Select value={bulkEditData.ownership} onValueChange={(value) => setBulkEditData(prev => ({...prev, ownership: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectOwnership')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">{t('noChange')}</SelectItem>
                      <SelectItem value="city">{t('city')}</SelectItem>
                      <SelectItem value="ely">{t('elyCenter')}</SelectItem>
                      <SelectItem value="private">{t('private')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={clearSelection}>
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={handleBulkUpdate}
                  disabled={bulkUpdateMutation.isPending}
                >
                  {bulkUpdateMutation.isPending ? t('updating') : t('updateSelected')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
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
                  <p className="text-xs lg:text-sm font-medium text-gray-600">{t('verifiedOnMap')}</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <Check className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">{t('inProgress')}</p>
                  <p className="text-sm lg:text-base font-medium text-gray-500">{t('featureComingSoon')}</p>
                </div>
                <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">{t('cleaned')}</p>
                  <p className="text-sm lg:text-base font-medium text-gray-500">{t('featureComingSoon')}</p>
                </div>
                <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
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
                  {availableDistricts.map(district => (
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
              <CardTitle className="text-lg flex items-center">
                <span>{t('graffitiReports')} ({filteredReports.length})</span>
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
                  <table className="w-full table-auto divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-3 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="h-auto p-1"
                          >
                            {selectedReports.size === filteredReports.length && filteredReports.length > 0 ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : selectedReports.size > 0 ? (
                              <MinusSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                        <th className="px-2 sm:px-3 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 xl:w-40">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('timestamp')}
                            className="h-auto p-0 font-medium hover:bg-transparent text-gray-500 hover:text-gray-700"
                          >
                            {t('date')}
                            {getSortIcon('timestamp')}
                          </Button>
                        </th>
                        <th className="px-2 sm:px-3 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 xl:w-24">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('id')}
                            className="h-auto p-0 font-medium hover:bg-transparent text-gray-500 hover:text-gray-700"
                          >
                            {t('reportId')}
                            {getSortIcon('id')}
                          </Button>
                        </th>
                        <th className="px-2 sm:px-3 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 xl:w-24">
                          {t('photo')}
                        </th>
                        <th className="px-2 sm:px-3 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 xl:w-40">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('district')}
                            className="h-auto p-0 font-medium hover:bg-transparent text-gray-500 hover:text-gray-700"
                          >
                            {t('district')}
                            {getSortIcon('district')}
                          </Button>
                        </th>
                        <th className="px-2 sm:px-3 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell w-32 xl:w-40">
                          {t('graffitiType')}
                        </th>
                        <th className="px-2 sm:px-3 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell min-w-48 xl:min-w-64">
                          {t('description')}
                        </th>
                        <th className="px-2 sm:px-3 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 xl:w-40">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('validated')}
                            className="h-auto p-0 font-medium hover:bg-transparent text-gray-500 hover:text-gray-700"
                          >
                            {t('validationStatus')}
                            {getSortIcon('validated')}
                          </Button>
                        </th>
                        <th className="px-2 sm:px-3 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell w-32 xl:w-40">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('status')}
                            className="h-auto p-0 font-medium hover:bg-transparent text-gray-500 hover:text-gray-700"
                          >
                            {t('status')}
                            {getSortIcon('status')}
                          </Button>
                        </th>
                        <th className="px-2 sm:px-3 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 xl:w-40">
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredReports.map((report) => (
                        <tr 
                          key={report.id} 
                          className={`hover:bg-gray-50 ${selectedReports.has(report.id) ? 'bg-blue-50 border-blue-200' : ''}`}
                        >
                          <td className="px-2 sm:px-3 xl:px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReportSelection(report.id);
                              }}
                              className="h-auto p-1"
                            >
                              {selectedReports.has(report.id) ? (
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                          <td 
                            className="px-2 sm:px-3 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-900 cursor-pointer"
                            onClick={() => openReportModal(report)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{new Date(report.timestamp).toLocaleDateString('fi-FI')}</span>
                              <span className="text-gray-500 text-xs">klo {new Date(report.timestamp).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td 
                            className="px-2 sm:px-3 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-900 cursor-pointer"
                            onClick={() => openReportModal(report)}
                          >
                            <span className="font-mono font-bold text-blue-600">#{report.id}</span>
                          </td>
                          <td 
                            className="px-2 sm:px-3 xl:px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => openReportModal(report)}
                          >
                            {report.photos && report.photos.length > 0 && (
                              <img 
                                src={report.photos[0]} 
                                alt="Report" 
                                className="w-12 h-12 xl:w-16 xl:h-16 rounded-lg object-cover"
                              />
                            )}
                          </td>
                          <td 
                            className="px-2 sm:px-3 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-900 cursor-pointer"
                            onClick={() => openReportModal(report)}
                          >
                            <div className="truncate">
                              {t(`districts.${report.district}`)}
                            </div>
                          </td>
                          <td 
                            className="px-2 sm:px-3 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm text-gray-900 hidden lg:table-cell cursor-pointer"
                            onClick={() => openReportModal(report)}
                          >
                            <div className="truncate">
                              {report.graffitiType ? t(report.graffitiType) : '-'}
                            </div>
                          </td>
                          <td 
                            className="px-2 sm:px-3 xl:px-6 py-4 text-xs xl:text-sm text-gray-900 hidden md:table-cell cursor-pointer"
                            onClick={() => openReportModal(report)}
                          >
                            <div className="line-clamp-2 xl:line-clamp-3" title={report.description}>
                              {report.description}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 xl:px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col xl:flex-row items-start xl:items-center space-y-1 xl:space-y-0 xl:space-x-2">
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
                          <td className="px-2 sm:px-3 xl:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <Select 
                              value={report.status} 
                              onValueChange={(value) => updateStatusMutation.mutate({ reportId: report.id, status: value })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <SelectTrigger 
                                className="w-full max-w-32 xl:max-w-40 h-8 text-xs"
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
                          <td className="px-2 sm:px-3 xl:px-6 py-4 whitespace-nowrap text-xs xl:text-sm">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReportModal(report);
                              }}
                              className="flex items-center px-1 xl:px-2 py-1 text-xs"
                            >
                              <Eye className="h-3 w-3 xl:mr-1" />
                              <span className="hidden xl:inline">{t('view')}</span>
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
          onDelete={() => {
            // Refetch reports after deletion
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}