import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, MapPin, Building, FileText, Mail, User, Send, Crosshair, Check, AlertTriangle, X } from 'lucide-react';
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
  const [isLocationManuallyAdjusted, setIsLocationManuallyAdjusted] = useState(false);

  const districts = [
    'asema', 'haapaniemi', 'huutijarvi', 'ilkko', 'kangasalan_keskusta',
    'kuohenmaa', 'lamminrahka', 'lentola', 'lihasula', 'raikku',
    'ranta_koivisto', 'raudanmaa', 'riku', 'ruutana', 'saarenmaa',
    'saarikylat', 'suinula', 'tiihala', 'vatiala', 'vehkajarvi', 'vaaksy'
  ];

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Clear previous selection and check for new files
    if (files.length === 0) return;
    
    // Warn user if they already have a photo and are trying to add more
    if (formData.photos.length > 0) {
      toast({
        title: t('validation.oneImageOnly'),
        description: t('validation.oneImageOnlyDesc'),
        variant: "destructive"
      });
      // Reset the input value to prevent confusion
      if (event.target) {
        event.target.value = '';
      }
      return;
    }
    
    // Only take the first file
    const selectedFile = files[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type.toLowerCase())) {
      toast({
        title: t('validation.invalidFileType'),
        description: t('validation.supportedFormats'),
        variant: "destructive"
      });
      if (event.target) {
        event.target.value = '';
      }
      return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast({
        title: t('validation.fileTooLarge'),
        description: t('validation.maxFileSize'),
        variant: "destructive"
      });
      if (event.target) {
        event.target.value = '';
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, photos: [selectedFile] }));
    
    // Create preview URL for the single image
    const url = URL.createObjectURL(selectedFile);
    setImagePreviewUrls([url]);
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
        setIsLocationManuallyAdjusted(false); // Reset manual adjustment flag
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
      // Create FormData for file upload
      const formDataForUpload = new FormData();
      
      // Add photos as files
      formData.photos.forEach((photo, index) => {
        formDataForUpload.append('photos', photo);
      });
      
      // Add other form fields
      formDataForUpload.append('latitude', formData.latitude!.toString());
      formDataForUpload.append('longitude', formData.longitude!.toString());
      formDataForUpload.append('district', formData.district);
      formDataForUpload.append('description', formData.description);
      formDataForUpload.append('status', 'new');
      formDataForUpload.append('validated', 'pending');
      
      if (formData.name) {
        formDataForUpload.append('name', formData.name);
      }
      if (formData.email) {
        formDataForUpload.append('email', formData.email);
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formDataForUpload, // Don't set Content-Type header, let browser set it with boundary
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      toast({
        title: t('thankYou'),
        description: t('thankYouMessage'),
      });
      
      // Reset form after successful submission
      setFormData({
        photos: [],
        latitude: null,
        longitude: null,
        district: '',
        description: '',
        name: '',
        email: ''
      });
      setLocationStatus('idle');
      setIsLocationManuallyAdjusted(false);
      
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
            {isLocationManuallyAdjusted ? (
              <Crosshair className="mr-2 h-4 w-4" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isLocationManuallyAdjusted ? t('obtainAutomatically') : t('locationObtained')}
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
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {formData.photos.length === 0 ? (
                  <>
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
                      <p className="text-xs text-gray-500">{t('supportedFormats')}</p>
                    </button>
                  </>
                ) : (
                  <div className="text-center text-green-600 py-4">
                    <Check className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">{t('photoSelected')}</p>
                  </div>
                )}
              </div>
            </div>
            
            {imagePreviewUrls.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <div className="relative inline-block">
                  <img
                    src={imagePreviewUrls[0]}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, photos: [] }));
                      setImagePreviewUrls([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
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
                  onClick={(lat, lng) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng
                    }));
                    setIsLocationManuallyAdjusted(true); // Mark as manually adjusted
                  }}
                />
                <p className="text-sm text-municipal-gray mt-2">
                  {t('coordinates')}: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-municipal-gray mt-1">
                  {t('clickMapToAdjust')}
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
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('privacyPhotoText')}
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>{t('supportedFormats')}:</strong> JPEG, PNG, WebP<br/>
                <strong>{t('maxFileSize')}:</strong> 5MB
              </p>
            </div>
          </div>
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
