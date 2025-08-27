# Töhryvahti – Ilmoita ilkivallasta

## Overview

Töhryvahti is a full-stack web application designed for reporting and managing graffiti incidents. Its primary purpose is to provide a user-friendly platform for citizens to report vandalism (specifically graffiti) and an efficient admin panel for municipal staff to track, manage, and respond to these reports. The project aims to contribute to a cleaner, more pleasant urban environment by streamlining the reporting process and facilitating effective follow-up. It is built with modern web technologies, ensuring mobile-friendliness and multilingual support, and is ready for beta testing and potential commercial deployment.

## User Preferences

Preferred communication style: Simple, everyday language.
Default application language: Finnish (fi) - users should see Finnish text by default, with option to switch to Swedish or English.
Districts updated to Finnish municipalities: Asema, Haapaniemi, Huutijärvi, Ilkko, Kangasalan keskusta, Kuohenmaa, Lamminrahka, Lentola, Lihasula, Raikku, Ranta-Koivisto, Raudanmaa, Riku, Ruutana, Saarenmaa, Saarikylät, Suinula, Tiihala, Vatiala, Vehkajärvi, Vääksy.
Background image: Professional royalty-free aerial photo of Finnish lake landscape from Pexels, showing authentic Finnish scenery.
Copyright notice: Localized copyright text in Finnish ("Kuva: DC Productions, Pexels (royalty-free)"), English ("Photo: DC Productions, Pexels (royalty-free)"), and Swedish ("Foto: DC Productions, Pexels (royalty-free)") displayed consistently across all pages.
Form language: "Ilmoita ilkivallasta" across all languages.

## System Architecture

### Frontend
- **Framework**: React with TypeScript.
- **UI/Styling**: Radix UI components, shadcn/ui styling, and Tailwind CSS with a custom municipal color scheme.
- **State Management**: React Query (TanStack Query) for server state.
- **Routing**: Wouter for client-side routing.
- **Internationalization**: react-i18next supporting Finnish, Swedish, and English.
- **Maps**: Leaflet for interactive map integration with dynamic loading and custom markers.
- **Build Tool**: Vite.
- **Design Principles**: Mobile-responsive design, semi-transparent overlays for background visibility, parallax scrolling for visual depth, and consistent footer components.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database**: PostgreSQL with Drizzle ORM.
- **File Storage**: Firebase Storage for image uploads and organized folder structures (`reports/YYYY-MM-DD/HH-MM-SS-reportID/`) including associated CSV files of report data.
- **Session Management**: In-memory with `connect-pg-simple` for production.

### Core Features
- **Public Reporting Form**: Multi-step form with camera integration, geolocation (with manual fallback), district selection, image upload, and optional contact info. Includes a "Töhryn tyyppi" dropdown with 6 graffiti categories.
- **Admin Dashboard**: Comprehensive panel for municipal staff including:
    - Statistics overview and interactive map.
    - Table view with sortable columns (Date, Report ID, District, Validation Status, Status) and filtering.
    - Multi-select functionality with checkboxes for bulk operations.
    - **Bulk Edit Panel**: Mass editing capabilities allowing admins to update multiple reports simultaneously for district, status, validation, and property ownership changes.
    - Report detail modal for status management, property ownership classification (city, ELY-keskus, private), and validation.
    - Real-time updates.
    - Export functionality (CSV download).
    - Analytics dashboard with 30-day daily reporting trends.
    - Change history tracking for all report modifications, including bulk updates.
    - Delete functionality with comprehensive cleanup (database, history, Firebase images/CSV).
- **Internationalization**: Full UI translation coverage with browser language detection and persistent preference storage.
- **Data Flow**: Images uploaded to Firebase, report data to PostgreSQL. Admin actions update database and Firebase CSVs, with comprehensive deletion for full cleanup. Enhanced GPS error handling and manual location selection for mobile compatibility.

## External Dependencies

- **Database**: Neon Database (serverless PostgreSQL).
- **File Storage/Real-time**: Firebase (Storage for images and data, for real-time updates).
- **ORM**: Drizzle ORM.
- **Mapping**: Leaflet (interactive maps).
- **UI Libraries**: Radix UI, shadcn/ui, Lucide React (icons).
- **Styling**: Tailwind CSS.
- **Build Tools**: Vite, ESBuild.
- **Charting**: Recharts (for analytics dashboard).