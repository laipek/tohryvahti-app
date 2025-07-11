import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapView } from './MapView';
import type { GraffitiReport } from '@shared/schema';

interface ReportModalProps {
  report: GraffitiReport;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (status: string) => void;
}

export function ReportModal({ report, isOpen, onClose, onStatusUpdate }: ReportModalProps) {
  const { t } = useTranslation();

  const formatDate = (timestamp: any) => {
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return date.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('reportDetails')}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {report.photos && report.photos.length > 0 && (
              <img
                src={report.photos[0]}
                alt="Graffiti report"
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-municipal-gray">{t('date')}</Label>
              <p className="text-gray-900">{formatDate(report.timestamp)}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-municipal-gray">{t('reportLocation')}</Label>
              <p className="text-gray-900">
                {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-municipal-gray">{t('district')}</Label>
              <p className="text-gray-900">{t(`districts.${report.district}`)}</p>
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
            
            {report.email && (
              <div>
                <Label className="text-sm font-medium text-municipal-gray">{t('email')}</Label>
                <p className="text-gray-900">{report.email}</p>
              </div>
            )}
            
            {report.phone && (
              <div>
                <Label className="text-sm font-medium text-municipal-gray">{t('phone')}</Label>
                <p className="text-gray-900">{report.phone}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <Label className="text-sm font-medium text-municipal-gray mb-2 block">{t('description')}</Label>
          <p className="text-gray-900 bg-municipal-light p-3 rounded-lg">
            {report.description}
          </p>
        </div>
        
        <div className="mt-6">
          <MapView
            latitude={report.latitude}
            longitude={report.longitude}
            zoom={16}
            className="h-48 rounded-lg"
          />
        </div>
        
        {report.photos && report.photos.length > 1 && (
          <div className="mt-6">
            <Label className="text-sm font-medium text-municipal-gray mb-2 block">{t('photos')}</Label>
            <div className="grid grid-cols-2 gap-4">
              {report.photos.slice(1).map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Additional photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
