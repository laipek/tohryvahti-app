import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, MapPin, Building, FileText, Mail, User, Send, Crosshair, Check, AlertTriangle } from 'lucide-react';
import { MapView } from './MapView';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

interface ReportFormData {
  photos: File[];
  latitude: number | null;
  longitude: number | null;
  district: string;
  description: string;
  name: string;
  email: string;
}

interface ReportFormProps {
  onSubmitSuccess: () => void;
}

export function ReportForm({ onSubmitSuccess }: ReportFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ReportFormData>({
    photos: [],
    latitude: null,
    longitude: null,
    district: '',
    description: '',
    name: '',
    email: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const districts = [
    'asema', 'haapaniemi', 'huutijarvi', 'ilkko', 'kangasalan_keskusta',
    'kuohenmaa', 'lamminrahka', 'lentola', 'lihasula', 'raikku',
    'ranta_koivisto', 'raudanmaa', 'riku', 'ruutana', 'saarenmaa',
    'saarikylat', 'suinula', 'tiihala', 'vatiala', 'vehkajarvi', 'vaaksy'
  ];

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({ ...prev, photos: files }));
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive"
      });
      return;
    }

    setLocationStatus('loading');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setLocationStatus('success');
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationStatus('error');
        toast({
          title: "Location Error",
          description: "Could not get your current location",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const uploadPhotos = async (photos: File[]): Promise<string[]> => {
    const uploadPromises = photos.map(async (photo, index) => {
      const fileName = `graffiti-reports/${Date.now()}-${index}-${photo.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, photo);
      return getDownloadURL(snapshot.ref);
    });
    
    return Promise.all(uploadPromises);
  };

  const validateForm = (): boolean => {
    if (formData.photos.length === 0) {
      toast({
        title: "Validation Error",
        description: t('validation.addPhoto'),
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.latitude === null || formData.longitude === null) {
      toast({
        title: "Validation Error",
        description: t('validation.getLocation'),
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.district) {
      toast({
        title: "Validation Error",
        description: t('validation.selectDistrict'),
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: t('validation.addDescription'),
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // For now, use the backend API instead of Firebase
      const reportData = {
        photos: formData.photos.map(file => URL.createObjectURL(file)), // Convert files to URLs for demo
        latitude: formData.latitude,
        longitude: formData.longitude,
        district: formData.district,
        description: formData.description,
        name: formData.name || null,
        email: formData.email || null,
        status: 'new',
        validated: 'pending'
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      toast({
        title: t('thankYou'),
        description: t('thankYouMessage'),
      });
      
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Virhe",
        description: "Ilmoituksen lähettäminen epäonnistui. Yritä uudelleen.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocationButtonContent = () => {
    switch (locationStatus) {
      case 'loading':
        return (
          <>
            <Crosshair className="mr-2 h-4 w-4 animate-spin" />
            {t('gettingLocation')}
          </>
        );
      case 'success':
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            {t('locationObtained')}
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t('locationError')}
          </>
        );
      default:
        return (
          <>
            <Crosshair className="mr-2 h-4 w-4" />
            {t('getCurrentLocation')}
          </>
        );
    }
  };

  const getLocationButtonClass = () => {
    switch (locationStatus) {
      case 'success':
        return 'bg-municipal-green hover:bg-green-700';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-municipal-blue hover:bg-blue-700';
    }
  };

  return (
    <Card className="w-full bg-white/50 backdrop-blur-md border-municipal-border/40 shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
          {t('reportGraffiti')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Photo Upload */}
          <div>
            <Label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Camera className="mr-2 h-4 w-4" />
              {t('takePhoto')}
            </Label>
            <div className="border-2 border-dashed border-municipal-border rounded-lg p-4 sm:p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrivacyDialog(true);
                  }}
                  className="flex-1 flex flex-col items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-municipal-blue mb-2" />
                  <p className="text-sm sm:text-base text-municipal-gray mb-1">{t('tapToTakePhoto')}</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrivacyDialog(true);
                  }}
                  className="flex-1 flex flex-col items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-municipal-gray mb-2" />
                  <p className="text-sm sm:text-base text-municipal-gray mb-1">{t('orSelectFile')}</p>
                </button>
              </div>
            </div>
            
            {imagePreviewUrls.length > 0 && (
              <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-4">
                {imagePreviewUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 sm:h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <Label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="mr-2 h-4 w-4" />
              {t('location')}
            </Label>
            <Button
              type="button"
              onClick={getCurrentLocation}
              className={`w-full ${getLocationButtonClass()} text-white`}
              disabled={locationStatus === 'loading'}
            >
              {getLocationButtonContent()}
            </Button>
            
            {formData.latitude && formData.longitude && (
              <div className="mt-3 sm:mt-4">
                <MapView
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  className="h-32 sm:h-48 rounded-lg"
                />
                <p className="text-sm text-municipal-gray mt-2">
                  {t('coordinates')}: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* District */}
          <div>
            <Label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Building className="mr-2 h-4 w-4" />
              {t('district')}
            </Label>
            <Select value={formData.district} onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}>
              <SelectTrigger className="border-municipal-border">
                <SelectValue placeholder={t('selectDistrict')} />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {t(`districts.${district}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="mr-2 h-4 w-4" />
              {t('description')}
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="border-municipal-border"
              placeholder={t('descriptionPlaceholder')}
            />
          </div>

          {/* Contact Information */}
          <div>
            <Label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Mail className="mr-2 h-4 w-4" />
              {t('contactInfo')}
            </Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-municipal-gray" />
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="border-municipal-border flex-1"
                  placeholder={`${t('name')} (${t('optional')})`}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-municipal-gray" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="border-municipal-border flex-1"
                  placeholder={`${t('email')} (${t('optional')})`}
                />
              </div>
            </div>
            <p className="text-xs text-municipal-gray mt-2">
              {t('contactInfoHelp')}
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-municipal-green hover:bg-green-700 text-white font-medium py-3 sm:py-2"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('submittingReport')}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t('submitReport')}
              </>
            )}
          </Button>
        </form>
      </CardContent>

      {/* Privacy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              {t('privacyNotice')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t('privacyPhotoText')}
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => {
                setShowPrivacyDialog(false);
                const input = fileInputRef.current;
                if (input) {
                  input.setAttribute('capture', 'environment');
                  input.click();
                }
              }}
              className="w-full bg-municipal-blue hover:bg-blue-700"
            >
              <Camera className="mr-2 h-4 w-4" />
              {t('tapToTakePhoto')}
            </Button>
            <Button
              onClick={() => {
                setShowPrivacyDialog(false);
                const input = fileInputRef.current;
                if (input) {
                  input.removeAttribute('capture');
                  input.click();
                }
              }}
              variant="outline"
              className="w-full border-municipal-border"
            >
              <FileText className="mr-2 h-4 w-4" />
              {t('orSelectFile')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
