import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapView } from './MapView';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { X, ZoomIn, History, Clock } from 'lucide-react';
import type { GraffitiReport, ReportHistoryEntry } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReportModalProps {
  report: GraffitiReport;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (status: string) => void;
  onPropertyUpdate?: (report: GraffitiReport) => void;
}

export function ReportModal({ report, isOpen, onClose, onStatusUpdate, onPropertyUpdate }: ReportModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [propertyOwner, setPropertyOwner] = useState(report.propertyOwner || '');
  const [propertyDescription, setPropertyDescription] = useState(report.propertyDescription || '');
  const [isUpdatingProperty, setIsUpdatingProperty] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch report history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/reports', report.id, 'history'],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${report.id}/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json() as Promise<ReportHistoryEntry[]>;
    },
    enabled: isOpen
  });

  const formatDate = (timestamp: any) => {
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return date.toLocaleString();
  };

  const handlePropertyUpdate = async () => {
    if (!propertyOwner) {
      toast({
        title: t('error'),
        description: t('selectPropertyOwner'),
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingProperty(true);
    try {
      const response = await apiRequest('PATCH', `/api/reports/${report.id}/property`, { propertyOwner, propertyDescription });

      if (response.ok) {
        const updatedReport = await response.json();
        toast({
          title: t('propertyUpdated'),
          description: t('propertyOwnerHelp'),
        });
        if (onPropertyUpdate) {
          onPropertyUpdate(updatedReport);
        }
      }
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: t('error'),
        description: 'Failed to update property information',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingProperty(false);
    }
  };

  const handleValidationUpdate = async (validated: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/reports/${report.id}/validate`, { validated });

      if (response.ok) {
        const updatedReport = await response.json();
        
        let titleKey = 'statusUpdated';
        let descriptionText = `Report ${validated}`;
        
        if (validated === 'approved') {
          titleKey = 'reportApproved';
          descriptionText = t('reportApproved');
        } else if (validated === 'rejected') {
          titleKey = 'reportRejected';
          descriptionText = t('reportRejected');
        } else if (validated === 'pending') {
          titleKey = 'statusUpdated';
          descriptionText = t('resetToPending');
        }
        
        toast({
          title: t(titleKey),
          description: descriptionText,
        });
        
        // Update the report data and close modal
        if (onPropertyUpdate) {
          onPropertyUpdate(updatedReport);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error updating validation:', error);
      toast({
        title: t('error'),
        description: 'Failed to update report validation',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('reportDetails')}
            <Badge variant={report.validated === 'approved' ? 'default' : 
                          report.validated === 'rejected' ? 'destructive' : 'secondary'}>
              {t(report.validated)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">{t('reportDetails')}</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t('changeHistory')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Photos and Map */}
          <div className="space-y-4">
            {report.photos && report.photos.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-municipal-gray">{t('photo')}</Label>
                <div className="relative group">
                  <img
                    src={report.photos[0]}
                    alt="Graffiti report"
                    className="w-full h-48 object-cover rounded-lg border border-municipal-border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setSelectedImage(report.photos[0]);
                      setIsImagePopupOpen(true);
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-lg">
                    <ZoomIn className="h-8 w-8 text-white" />
                  </div>
                </div>
                {report.photos.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('clickToView')} (+{report.photos.length - 1} {t('morePhotos')})
                  </p>
                )}
              </div>
            )}
            
            <div>
              <Label className="text-sm font-medium text-municipal-gray">{t('reportLocation')}</Label>
              <MapView
                latitude={report.latitude}
                longitude={report.longitude}
                zoom={15}
                markers={[{
                  lat: report.latitude,
                  lng: report.longitude,
                  title: t('reportLocation'),
                  status: report.status as 'new' | 'progress' | 'cleaned'
                }]}
                className="h-40 rounded-lg border border-municipal-border"
              />
              <p className="text-xs text-gray-500 mt-1">
                {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
              </p>
            </div>
          </div>
          
          {/* Right Column - Details and Actions */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('reportDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-municipal-gray">{t('date')}</Label>
                  <p className="text-gray-900">{formatDate(report.timestamp)}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-municipal-gray">{t('district')}</Label>
                  <p className="text-gray-900">{t(`districts.${report.district}`)}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-municipal-gray">{t('description')}</Label>
                  <p className="text-gray-900">{report.description}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-municipal-gray">{t('status')}</Label>
                  <Select value={report.status} onValueChange={onStatusUpdate}>
                    <SelectTrigger className="border-municipal-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{t('new')}</SelectItem>
                      <SelectItem value="progress">{t('progress')}</SelectItem>
                      <SelectItem value="cleaned">{t('cleaned')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('contactInfo')}</CardTitle>
                <p className="text-sm text-municipal-gray">{t('contactStatusUpdates')}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.name || report.email ? (
                  <>
                    {report.name && (
                      <div>
                        <Label className="text-sm font-medium text-municipal-gray">{t('reporterName')}</Label>
                        <p className="text-gray-900">{report.name}</p>
                      </div>
                    )}
                    {report.email && (
                      <div>
                        <Label className="text-sm font-medium text-municipal-gray">{t('reporterEmail')}</Label>
                        <p className="text-gray-900">{report.email}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 text-sm">{t('anonymous')}</div>
                )}
              </CardContent>
            </Card>

            {/* Property Ownership Management */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('propertyOwner')}</CardTitle>
                <p className="text-sm text-municipal-gray">{t('propertyOwnerHelp')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="propertyOwner" className="text-sm font-medium text-municipal-gray">
                    {t('propertyOwner')}
                  </Label>
                  <Select value={propertyOwner} onValueChange={setPropertyOwner}>
                    <SelectTrigger className="border-municipal-border">
                      <SelectValue placeholder={t('selectPropertyOwner')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="city">{t('city')}</SelectItem>
                      <SelectItem value="ely-keskus">{t('elyKeskus')}</SelectItem>
                      <SelectItem value="private">{t('private')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="propertyDescription" className="text-sm font-medium text-municipal-gray">
                    {t('propertyDescription')}
                  </Label>
                  <Textarea
                    id="propertyDescription"
                    value={propertyDescription}
                    onChange={(e) => setPropertyDescription(e.target.value)}
                    placeholder="e.g., Main street bridge, School building east wall, Shopping center parking area..."
                    className="border-municipal-border"
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handlePropertyUpdate}
                  disabled={isUpdatingProperty || !propertyOwner}
                  className="w-full bg-municipal-blue hover:bg-blue-600"
                >
                  {isUpdatingProperty ? t('updating') : t('updateProperty')}
                </Button>
              </CardContent>
            </Card>

            {/* Report Validation Management */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('reportValidation')}</CardTitle>
                <p className="text-sm text-municipal-gray">{t('validationHelp')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-municipal-gray">{t('currentStatus')}</Label>
                  <div className="mt-1">
                    {report.validated === 'pending' && (
                      <Badge className="bg-yellow-100 text-yellow-800">{t('pending')}</Badge>
                    )}
                    {report.validated === 'approved' && (
                      <Badge className="bg-green-100 text-green-800">{t('approved')}</Badge>
                    )}
                    {report.validated === 'rejected' && (
                      <Badge className="bg-red-100 text-red-800">{t('rejected')}</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  {report.validated !== 'approved' && (
                    <Button 
                      onClick={() => handleValidationUpdate('approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      {report.validated === 'pending' ? t('approve') : t('changeToApproved')}
                    </Button>
                  )}
                  {report.validated !== 'rejected' && (
                    <Button 
                      onClick={() => handleValidationUpdate('rejected')}
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                    >
                      {report.validated === 'pending' ? t('reject') : t('changeToRejected')}
                    </Button>
                  )}
                  {report.validated !== 'pending' && (
                    <Button 
                      onClick={() => handleValidationUpdate('pending')}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      {t('resetToPending')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="history" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('changeHistory')}
            </CardTitle>
            <p className="text-sm text-gray-600">{t('historyDescription')}</p>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('noHistoryFound')}</p>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-municipal-blue pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-municipal-primary">
                            {t(`historyActions.${entry.action}`)}
                          </span>
                          {entry.oldValue && entry.newValue && (
                            <span className="text-sm text-gray-600">
                              {entry.oldValue} → {entry.newValue}
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-gray-700 mb-1">{entry.notes}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatDate(entry.timestamp)}</span>
                          {entry.adminUser && (
                            <span>by {entry.adminUser}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
      </DialogContent>

      {/* Image Popup Dialog */}
      <Dialog open={isImagePopupOpen} onOpenChange={setIsImagePopupOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black">
          <div className="relative h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsImagePopupOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full size graffiti report"
                className="w-full h-full object-contain"
                style={{ maxHeight: '95vh' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
