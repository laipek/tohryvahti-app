# Töhryvahti – Ilmoita ilkivallasta

## Overview

This is a full-stack web application for reporting and managing graffiti incidents. The system consists of two main parts: a public-facing form for citizens to report graffiti and an admin panel for municipal staff to manage and track reports. The application is built with modern web technologies and designed to be mobile-friendly and multilingual.

## User Preferences

Preferred communication style: Simple, everyday language.
Default application language: Finnish (fi) - users should see Finnish text by default, with option to switch to Swedish or English.
Districts updated to Finnish municipalities: Asema, Haapaniemi, Huutijärvi, Ilkko, Kangasalan keskusta, Kuohenmaa, Lamminrahka, Lentola, Lihasula, Raikku, Ranta-Koivisto, Raudanmaa, Riku, Ruutana, Saarenmaa, Saarikylät, Suinula, Tiihala, Vatiala, Vehkajärvi, Vääksy.
Background image: Use authentic Finnish landscape from Kangasala area (Vehoniemenharju) with proper attribution.
Copyright notice: "Vehoniemenharju. Kuva: Lassi Välimaa / visitkangasala.fi" displayed in bottom right corner.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom municipal color scheme
- **State Management**: React Query (TanStack Query) for server state
- **Internationalization**: react-i18next with support for Finnish, Swedish, and English
- **Maps Integration**: Leaflet for interactive maps
- **Build Tool**: Vite for development and building

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Storage**: Currently using Firebase Storage for image uploads
- **Session Management**: In-memory storage with fallback for PostgreSQL sessions

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon (serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **File Storage**: Firebase Storage for uploaded images
- **Session Storage**: In-memory with connect-pg-simple for production

## Key Components

### Public Reporting Form
- Multi-step form for graffiti reporting
- Camera integration for photo capture
- Geolocation detection with map preview
- District selection dropdown
- Optional contact information
- Image upload with preview
- Form validation and error handling

### Admin Dashboard
- Statistics overview with status counts
- Interactive map view of all reports
- Table view with filtering capabilities
- Report detail modal with status management
- Real-time updates using Firebase listeners

### Internationalization
- Support for Finnish (primary), Swedish, and English
- Browser language detection
- Persistent language preference storage
- Complete UI translation coverage

### Map Integration
- Dynamic Leaflet map loading to avoid SSR issues
- Custom markers for different report statuses
- Click-to-select location functionality
- Responsive map sizing

## Data Flow

1. **Report Submission**:
   - User fills out form with photos, location, and description
   - Images uploaded to Firebase Storage
   - Form data validated on client and server
   - Report stored in PostgreSQL database
   - Success confirmation displayed

2. **Admin Management**:
   - Real-time report fetching from database
   - Status filtering and search capabilities
   - Report status updates sync to database
   - Map and table views update automatically

3. **Data Persistence**:
   - PostgreSQL stores structured report data
   - Firebase handles image file storage
   - Drizzle ORM manages database schema and migrations

## External Dependencies

### Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting
- **Firebase**: File storage and real-time updates
- **Drizzle Kit**: Database migrations and schema management

### Maps & Location
- **Leaflet**: Open-source interactive maps
- **Browser Geolocation API**: Current location detection

### UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety across the stack
- **ESBuild**: Production bundling

## Deployment Strategy

### Development Environment
- Vite dev server for frontend hot reloading
- Express server with TypeScript compilation
- Environment variables for database and Firebase configuration
- Replit integration with error overlay and cartographer

### Production Build
- Vite builds optimized frontend bundle
- ESBuild bundles server code for Node.js
- Static files served from Express
- Database migrations run via Drizzle Kit

### Environment Configuration
- Database URL for Neon PostgreSQL connection
- Firebase configuration for storage and real-time features
- Language detection and persistence
- Mobile-responsive design considerations
- Authentic Finnish landscape background with proper copyright attribution

## Recent Changes (January 2025)

✓ Implemented complete dual-app architecture (public form + admin dashboard)
✓ Added Finnish language as default with Swedish/English support
✓ Integrated 21 specific Finnish districts from Kangasala area
✓ Added beautiful Finnish landscape background (Vehoniemenharju)
✓ Applied semi-transparent styling to maintain readability over background
✓ Added proper image copyright attribution: "Vehoniemenharju. Kuva: Lassi Välimaa / visitkangasala.fi"
✓ Mobile-responsive design with camera integration and geolocation
✓ Firebase integration setup (requires API keys for full functionality)
✓ Enhanced admin dashboard with contact information and property ownership columns
✓ Implemented comprehensive property ownership classification (city, ELY-keskus, private)
✓ Added detailed report modal with property management and validation actions
✓ Updated terminology from "confirmed" to "validated" reports for clarity
✓ Created commercial-ready system with proper budget allocation tracking
✓ Clarified contact information as optional with transparency about status update usage
✓ Enhanced transparency: Increased card opacity to 75% for better background visibility
✓ Improved footer structure: Added comprehensive beta disclaimer and legal text
✓ Refined language: Updated disclaimer to emphasize "viihtyisämpi ja töhrytön ympäristö" 
✓ Mobile optimization: Language selector moved to inline footer for better header space
✓ System ready for beta testing deployment on Replit platform

### Scalability Considerations
- Serverless database (Neon) scales automatically
- In-memory storage can be replaced with Redis for horizontal scaling
- Firebase handles file storage scaling
- CDN integration possible for static assets