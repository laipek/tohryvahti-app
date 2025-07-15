# Töhryvahti – Ilmoita ilkivallasta

## Overview

This is a full-stack web application for reporting and managing graffiti incidents. The system consists of two main parts: a public-facing form for citizens to report graffiti and an admin panel for municipal staff to manage and track reports. The application is built with modern web technologies and designed to be mobile-friendly and multilingual.

## User Preferences

Preferred communication style: Simple, everyday language.
Default application language: Finnish (fi) - users should see Finnish text by default, with option to switch to Swedish or English.
Districts updated to Finnish municipalities: Asema, Haapaniemi, Huutijärvi, Ilkko, Kangasalan keskusta, Kuohenmaa, Lamminrahka, Lentola, Lihasula, Raikku, Ranta-Koivisto, Raudanmaa, Riku, Ruutana, Saarenmaa, Saarikylät, Suinula, Tiihala, Vatiala, Vehkajärvi, Vääksy.
Background image: Professional royalty-free aerial photo of Finnish lake landscape from Pexels, showing authentic Finnish scenery.
Copyright notice: Localized copyright text in Finnish ("Kuva: DC Productions, Pexels (royalty-free)"), English ("Photo: DC Productions, Pexels (royalty-free)"), and Swedish ("Foto: DC Productions, Pexels (royalty-free)") displayed consistently across all pages.

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
✓ Legal clarity: Updated disclaimer to specify service provider (not municipality) gets data/image rights
✓ Commercial independence: Clarified municipalities have no involvement in the service
✓ Copyright formatting: Moved "Kuva:" prefix to beginning of image attribution
✓ Report validation: Added disclaimer about report verification and inappropriate content removal
✓ Header simplification: Updated to show only "Töhryvahti" with original font styling and larger size
✓ Form language update: Changed "Ilmoita graffitista" to "Ilmoita ilkivallasta" across all languages
✓ Logo planning: Custom logo development deferred for future iteration
✓ GDPR compliance: Updated disclaimers to meet Finnish tietosuoja.fi requirements
✓ Legal basis specified: Added proper consent mechanism and legitimate interest basis
✓ Privacy enhancement: Strengthened photo privacy notices with GDPR references
✓ System ready for beta testing deployment on Replit platform
✓ Enhanced verification status management - admins can change between approved/rejected/pending states
✓ Added clickable table rows in admin panel that open detailed case modals
✓ Implemented parallax scrolling effect for background image across all pages
✓ Background now moves at different pace than content for improved visual depth
✓ Optimized background scaling to 150% for complete coverage without excessive oversizing
✓ Fixed background coverage issues on submit page with enhanced transparency settings
✓ Enhanced admin table with proper date/time display as first column
✓ Added clickable image popup functionality for full-size image viewing in admin panel
✓ Fixed image upload handling with proper FormData and base64 conversion
✓ All mock reports include realistic timestamps and new reports automatically get current timestamp
✓ Implemented comprehensive change history tracking system with new database schema and storage methods
✓ Created history API endpoint (/api/reports/:id/history) for fetching change logs
✓ Added tabbed interface in admin report modal with dedicated History tab
✓ History displays all actions (creation, status changes, validation, property updates) with timestamps and admin user info
✓ Mock reports include realistic history entries showing progression from creation to current state
✓ Finnish translations added for history interface and action types
✓ Enhanced admin panel with desktop/mobile view toggle and comprehensive toolbar
✓ Export functionality implemented - CSV download with all report data and Finnish translations
✓ Analytics dashboard with interactive line chart showing daily reporting trends over 30 days
✓ Report ID column added to table for unique tracking and identification
✓ Delete functionality with confirmation dialog - removes reports and associated history
✓ Sortable table columns implemented for Date, Report ID, District, Validation Status, and Status
✓ Horizontal scrolling support for table on smaller screens with max-width overflow handling
✓ Enhanced table headers with clickable sort buttons and visual sort indicators
✓ Sort state management with ascending/descending toggle and visual feedback
✓ Updated disclaimer text across all languages with feedback email tuki(at)tohryvahti.fi
✓ Created internationalized disclaimer system with proper translation keys
✓ Added multilingual support for beta version notice, data processing terms, and contact information
✓ Added analytics toggle button to public map page with daily report statistics
✓ Implemented public analytics view with interactive line chart showing last 30 days
✓ Updated language to use "vahvistetut ilmoitukset" instead of "graffiti" mentions
✓ Created comprehensive info page explaining Töhryvahti's purpose, features, and data usage
✓ Added info page navigation button next to map button in header
✓ Moved admin delete functionality from table to report modal with confirmation dialog
✓ Enhanced delete safety with multi-step confirmation and report verification display
✓ Standardized footer components across all pages (PublicForm, PublicMap, InfoPage) with identical language selector, disclaimer, and copyright styling
✓ Applied consistent semi-transparent backgrounds and centered language selectors for uniform user experience
✓ Enhanced subtitle visibility on InfoPage with semi-transparent background matching other content boxes
✓ Added "Töhryn tyyppi" dropdown menu with 6 graffiti categories: Tussiteksti tai kuva, Spray-tägi, Spray-kuva, Tarra, Tahallinen naarmu, Muu ilkivalta
✓ Implemented full multilingual support for graffiti type options across Finnish, Swedish, and English
✓ Updated database schema and form validation to include graffiti type classification
✓ Positioned graffiti type selector above description field for logical form flow
✓ **ORGANIZED FOLDER STRUCTURE COMPLETED**: Each report creates structured folders in Firebase Storage
✓ **Folder Format**: `reports/YYYY-MM-DD/HH-MM-SS-reportID/` with images and CSV files
✓ **CSV Generation**: Complete report data exported as CSV file in each report folder
✓ **Database Tracking**: Added csvData and folderPath fields to track organized storage
✓ **Multi-tier Upload**: Firebase Storage primary with database fallback when permission issues occur
✓ **CSV Regeneration**: Admin modifications automatically update CSV files in Firebase Storage
✓ **Complete Storage Cleanup**: Report deletion removes entire Firebase Storage folder and all files
✓ **Comprehensive Deletion**: Database entries, history, images, and CSV files all cleaned up together
✓ **Image Popup Functionality**: Fixed full-size image viewing with separate ImagePopup component to avoid nested Dialog issues
✓ **Enhanced Image Interaction**: Clickable images in admin panel open full-size popup with proper overlay effects
✓ **Improved Location Handling**: Enhanced GPS error handling with specific error messages and user guidance
✓ **Manual Location Option**: Added fallback manual location selection when GPS fails or is disabled
✓ **User-Friendly Error Messages**: Comprehensive help text for location permission issues with step-by-step instructions

## Completed Admin Panel Features

### UI/UX Improvements
✓ Desktop-optimized admin interface with mobile view toggle in enhanced toolbar
✓ Each report displays unique ID (#1, #2, etc.) for tracking and processing
✓ Clickable sortable columns for Date, Report ID, District, Validation Status, and Status
✓ Visual sort indicators showing active column and direction (ascending/descending)
✓ Horizontal scrolling support for table overflow on smaller screens
✓ Enhanced table responsiveness with proper column management

### Data Management Features  
✓ Export functionality downloads CSV with Finnish-localized data
✓ Delete functionality with confirmation dialog removes reports and history
✓ Import/add report buttons prepared for future development (currently disabled)
✓ Comprehensive data export includes all report fields and translations

### Analytics & Visualization
✓ Interactive analytics dashboard with daily reporting trends
✓ Line chart visualization showing reports over last 30 days using Recharts
✓ Toggle-able analytics view integrated into admin toolbar
✓ Real-time data visualization with responsive charts

### Data Integrity & Features
✓ Change history tracking with complete audit trail
✓ Backwards compatibility maintained for existing reports
✓ Report deletion includes cleanup of associated history entries
✓ Robust data handling with proper error management

### Scalability Considerations
- Serverless database (Neon) scales automatically
- In-memory storage can be replaced with Redis for horizontal scaling
- Firebase handles file storage scaling
- CDN integration possible for static assets