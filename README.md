# S3 Client GUI

A modern, full-stack web application that provides a user-friendly interface for managing AWS S3 storage. Built with React, TypeScript, and Express.js.

## ✨ Features

### 🔐 Authentication & Connection
- **AWS Access Keys**: Connect using Access Key ID and Secret Access Key
- **Role Assumption**: Connect using AWS IAM Role ARN for secure access
- **Session Management**: Secure cookie-based sessions that expire when browser closes
- **Multiple AWS Regions**: Support for all major AWS regions

### 📁 S3 Management
- **Bucket Listing**: View all your S3 buckets in a clean interface
- **File Browser**: Navigate through folder structures with breadcrumb navigation
- **File Operations**:
  - Upload files with drag & drop support
  - Download files with presigned URLs
  - Delete files and folders
  - Copy shareable download URLs

### 🎨 User Interface
- **Dark Theme**: Modern dark theme design system
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Live synchronization of file operations
- **Search Functionality**: Filter files and folders
- **File Type Icons**: Visual indicators for different file types

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- AWS Account with S3 access
- AWS credentials or IAM role with S3 permissions

### Installation

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Start the Application**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   Open your browser and navigate to `http://localhost:5000`

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Session Security (optional - defaults to dev-secret-key)
SESSION_SECRET=your-secret-key-here

# Database (optional - uses in-memory storage by default)
DATABASE_URL=postgresql://user:password@host:port/database
```

### AWS Setup

#### Option 1: Access Keys
1. Go to AWS Console → IAM → Users → Your User → Security Credentials
2. Create new Access Key
3. Use the Access Key ID and Secret Access Key in the application

#### Option 2: Role Assumption
1. Create an IAM role with S3 permissions
2. Set up trust relationship for your AWS account
3. Use the Role ARN in the application

### Required AWS Permissions
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets",
                "s3:ListBucket",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetBucketLocation"
            ],
            "Resource": "*"
        }
    ]
}
```

## 📱 Usage Guide

### 1. Connect to AWS
- Choose between **Access Keys** or **Role ARN** authentication
- Enter your credentials and select AWS region
- Click **Connect to AWS**

### 2. Browse Buckets
- Once connected, all your S3 buckets will appear in the sidebar
- Click on any bucket to start browsing its contents

### 3. Navigate Files
- Use breadcrumb navigation to move through folders
- Click folders to enter them
- Use the search bar to find specific files

### 4. File Operations
- **Upload**: Click "Upload" button or drag files into the upload modal
- **Download**: Click the download icon next to any file
- **Share**: Click the link icon to copy a shareable download URL
- **Delete**: Click the trash icon to delete files (with confirmation)

### 5. Disconnect
- Click "Disconnect" to securely end your session
- All credentials are automatically cleared from memory

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite build tool
- **UI Components**: Radix UI primitives with Tailwind CSS
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend (Node.js + Express)
- **Server**: Express.js with TypeScript
- **AWS SDK**: AWS SDK v3 for S3 and STS operations
- **Session Management**: Cookie-based sessions
- **Storage**: In-memory storage (configurable to PostgreSQL)

### Security Features
- Secure cookie configuration with httpOnly and sameSite
- Credentials stored server-side, never exposed to client
- Session-based authentication with automatic cleanup
- CSRF protection through SameSite cookies

## 🛠️ Development

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   └── lib/           # Utilities and configurations
├── server/                # Backend Express application
│   ├── services/          # AWS service integrations
│   ├── routes.ts          # API route definitions
│   └── storage.ts         # Data storage interface
├── shared/                # Shared TypeScript types
└── package.json
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### API Endpoints
- `POST /api/connect/credentials` - Connect with access keys
- `POST /api/connect/role` - Connect with role assumption
- `GET /api/connection/status` - Check connection status
- `POST /api/disconnect` - Disconnect and clear session
- `GET /api/buckets` - List all buckets
- `GET /api/buckets/:bucket/objects` - List objects in bucket
- `GET /api/buckets/:bucket/objects/:key/download` - Get download URL
- `DELETE /api/buckets/:bucket/objects/:key` - Delete object

## 🔒 Security Considerations

- **Credentials**: Never stored in browser or client-side storage
- **Sessions**: Expire automatically when browser closes
- **HTTPS**: Use HTTPS in production for secure credential transmission
- **Permissions**: Follow principle of least privilege for AWS IAM
- **Environment**: Keep SESSION_SECRET secure in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🔄 Changelog

### v1.0.0
- Initial release
- AWS S3 integration with access keys and role assumption
- File browser with upload, download, and delete operations
- Dark theme UI with responsive design
- Session-based authentication