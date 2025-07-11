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
import type { GraffitiReport } from '@shared/schema';

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
      const response = await apiRequest({
        method: 'PATCH',
        url: `/api/reports/${report.id}/property`,
        body: { propertyOwner, propertyDescription },
      });

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
      const response = await apiRequest({
        method: 'PATCH',
        url: `/api/reports/${report.id}/validation`,
        body: { validated },
      });

      if (response.ok) {
        toast({
          title: validated === 'approved' ? t('validateReport') : t('rejectReport'),
          description: `Report ${validated}`,
        });
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Photos and Map */}
          <div className="space-y-4">
            {report.photos && report.photos.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-municipal-gray">{t('photo')}</Label>
                <img
                  src={report.photos[0]}
                  alt="Graffiti report"
                  className="w-full h-48 object-cover rounded-lg border border-municipal-border"
                />
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

            {/* Report Validation Actions */}
            {report.validated === 'pending' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Report Validation</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button 
                    onClick={() => handleValidationUpdate('approved')}
                    className="flex-1 bg-municipal-green hover:bg-green-600 text-white"
                  >
                    {t('validateReport')}
                  </Button>
                  <Button 
                    onClick={() => handleValidationUpdate('rejected')}
                    variant="destructive"
                    className="flex-1"
                  >
                    {t('rejectReport')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
