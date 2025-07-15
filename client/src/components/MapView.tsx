import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Load Leaflet dynamically to avoid SSR issues
const loadLeaflet = async () => {
  if (typeof window === 'undefined') return null;
  
  // Load Leaflet CSS
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  
  // Load Leaflet JS
  const L = await import('leaflet');
  
  // Fix default markers
  delete (L as any).Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
  
  return L;
};

interface MapViewProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: Array<{
    lat: number;
    lng: number;
    title?: string;
    popup?: string;
    status?: 'new' | 'progress' | 'cleaned';
    photo?: string;
    timestamp?: Date;
    district?: string;
    id?: number;
  }>;
  className?: string;
  onClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (markerId: number) => void;
  showMainMarker?: boolean; // New prop to control main marker visibility
}

export function MapView({ 
  latitude, 
  longitude, 
  zoom = 16, 
  markers = [], 
  className,
  onClick,
  onMarkerClick,
  showMainMarker = false
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;
      
      const L = await loadLeaflet();
      if (!L) return;

      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Create new map
      const map = L.map(mapRef.current).setView([latitude, longitude], zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add main marker only when requested (for form views)
      if (showMainMarker) {
        L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup(t('reportLocationLabel'))
          .openPopup();
      }

      // Add additional markers with enhanced popups
      markers.forEach(marker => {
        const markerInstance = L.marker([marker.lat, marker.lng]).addTo(map);
        
        // Create comprehensive popup content
        let popupContent = `<div style="min-width: 250px; max-width: 300px;">`;
        
        if (marker.photo) {
          popupContent += `<img src="${marker.photo}" alt="Report photo" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">`;
        }
        
        if (marker.title) {
          popupContent += `<div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #1f2937;">${marker.title}</div>`;
        }
        
        if (marker.timestamp) {
          const date = new Date(marker.timestamp);
          const formattedDate = date.toLocaleDateString('fi-FI', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          popupContent += `<div style="color: #6b7280; font-size: 14px; margin-bottom: 6px; display: flex; align-items: center;">
            <span style="margin-right: 6px;">📅</span> ${formattedDate}
          </div>`;
        }
        
        if (marker.district) {
          popupContent += `<div style="color: #6b7280; font-size: 14px; margin-bottom: 6px; display: flex; align-items: center;">
            <span style="margin-right: 6px;">📍</span> ${marker.district}
          </div>`;
        }
        
        if (marker.status) {
          const statusColors = {
            'new': 'background-color: #fef3c7; color: #92400e; border: 1px solid #fbbf24;',
            'progress': 'background-color: #fef3c7; color: #92400e; border: 1px solid #fbbf24;',
            'cleaned': 'background-color: #d1fae5; color: #065f46; border: 1px solid #10b981;'
          };
          const statusText = {
            'new': 'Uusi',
            'progress': 'Käsittelyssä', 
            'cleaned': 'Puhdistettu'
          };
          popupContent += `<div style="margin-bottom: 8px;">
            <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; ${statusColors[marker.status] || statusColors['new']}">
              ${statusText[marker.status] || marker.status}
            </span>
          </div>`;
        }
        
        if (marker.popup) {
          popupContent += `<div style="margin-top: 8px; padding: 8px; background-color: #f9fafb; border-radius: 6px; font-size: 14px; line-height: 1.4; color: #374151;">
            ${marker.popup}
          </div>`;
        }
        
        popupContent += `</div>`;
        
        if (popupContent) {
          markerInstance.bindPopup(popupContent, { maxWidth: 350, className: 'custom-popup' });
        }
        
        // Add click handler to marker
        if (onMarkerClick && marker.id) {
          markerInstance.on('click', (e: any) => {
            e.originalEvent.stopPropagation();
            onMarkerClick(marker.id!);
          });
        }
      });

      // Handle click events
      if (onClick) {
        map.on('click', (e: any) => {
          onClick(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, zoom, markers, onClick, onMarkerClick, t]);

  return (
    <div 
      ref={mapRef} 
      className={cn('w-full h-64 bg-municipal-border rounded-lg', className)}
    />
  );
}
