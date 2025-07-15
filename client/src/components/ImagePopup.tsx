import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export function ImagePopup({ isOpen, onClose, imageUrl }: ImagePopupProps) {
  console.log('ImagePopup render - isOpen:', isOpen, 'imageUrl:', imageUrl);
  
  if (!imageUrl) {
    console.log('ImagePopup: No imageUrl provided, returning null');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-none">
        <div className="relative w-full h-[95vh]">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 text-white hover:bg-opacity-75 border border-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
          <img
            src={imageUrl}
            alt="Full size report image"
            className="w-full h-full object-contain"
            style={{ maxHeight: '95vh', maxWidth: '95vw' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}