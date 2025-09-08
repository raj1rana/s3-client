# S3 Client Application

## Overview

This is a full-stack web application that provides a user-friendly interface for managing AWS S3 storage. The application allows users to connect to their AWS accounts using either direct credentials or role assumption, browse S3 buckets, navigate folder structures, and manage files with features like upload, download, and sharing capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Styling**: Dark theme design system with CSS variables and Tailwind CSS

### Backend Architecture
- **Server**: Express.js with TypeScript running on Node.js
- **Session Management**: Cookie-based sessions using cookie-session middleware
- **Storage**: In-memory storage for session data (MemStorage class)
- **AWS Integration**: AWS SDK v3 for S3 operations and STS for role assumption
- **Development**: Hot module replacement with Vite in development mode

### Data Storage Solutions
- **Database**: PostgreSQL configured via Drizzle ORM (schema defined but database operations not fully implemented)
- **Session Storage**: In-memory storage for temporary AWS credential sessions
- **File Storage**: AWS S3 for actual file storage and management

### Authentication and Authorization
- **AWS Credentials**: Two authentication methods supported:
  1. Direct AWS access keys (Access Key ID, Secret Access Key, optional Session Token)
  2. AWS Role Assumption using STS (Role ARN with temporary credential generation)
- **Session Management**: Server-side sessions to maintain AWS credential state
- **Security**: Secure cookie configuration with httpOnly and sameSite settings

### External Dependencies
- **AWS Services**: 
  - S3 for object storage operations (list buckets, objects, upload, download, delete)
  - STS for role assumption and temporary credential generation
- **Database**: Neon Database (PostgreSQL) configured via DATABASE_URL environment variable
- **Development Tools**: Replit-specific plugins for development environment integration
- **UI Components**: Comprehensive Radix UI component library for accessible interface elements

### Key Features
- **Multi-tenancy**: Support for multiple AWS account connections via different credential methods
- **File Management**: Complete CRUD operations for S3 objects including folder navigation
- **Presigned URLs**: Secure file sharing and downloading using AWS presigned URLs
- **Real-time Updates**: Query invalidation and refetching for live data synchronization
- **Responsive Design**: Mobile-friendly interface with dark theme support
- **Error Handling**: Comprehensive error boundaries and user feedback systems