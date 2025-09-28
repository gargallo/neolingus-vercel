# Admin Dashboard Architecture - NeoLingus

## Overview

Comprehensive admin dashboard design for managing the NeoLingus platform, including course management, user administration, payment oversight, and system analytics.

## Architecture Principles

### Core Design Philosophy
- **Role-Based Access Control (RBAC)**: Granular permissions for different admin roles
- **Real-Time Dashboard**: Live analytics and monitoring capabilities
- **Security-First**: Multi-layer authentication and audit logging
- **Scalable Design**: Modular architecture supporting future growth
- **User Experience**: Intuitive interface optimized for administrative workflows

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin Dashboard Frontend                    │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard │  Courses │  Users  │ Payments │ Analytics │ Config │
├─────────────────────────────────────────────────────────────────┤
│                     Admin API Layer                            │
├─────────────────────────────────────────────────────────────────┤
│           Authentication & Authorization Middleware             │
├─────────────────────────────────────────────────────────────────┤
│      Database Layer (Supabase) │    External Services         │
│   • Admin Tables               │  • Payment Gateways          │
│   • Course Management          │  • Analytics Services        │
│   • User Management            │  • Email Services            │
│   • Audit Logs                 │  • Storage Services          │
└─────────────────────────────────────────────────────────────────┘
```

## Database Extensions for Admin

### Admin-Specific Tables

```sql
-- Admin users and roles
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'course_manager', 'support')),
    permissions JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id)
);

-- System audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID,
    payment_provider TEXT NOT NULL, -- 'stripe', 'paypal'
    payment_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Site configuration
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Admin Dashboard Modules

### 1. Dashboard Overview
**Purpose**: High-level metrics and system health monitoring

**Key Features**:
- Real-time user activity metrics
- Course enrollment statistics
- Payment transaction summaries  
- System performance indicators
- Quick access to critical admin functions

**Metrics Displayed**:
- Active users (24h, 7d, 30d)
- Course completion rates
- Revenue analytics
- Exam session statistics
- Cultural performance insights

### 2. User Management
**Purpose**: Complete user lifecycle management

**Core Functionality**:
- User search and filtering
- Account status management
- Course enrollment oversight
- Payment history review
- Support ticket handling

**User Actions**:
- Create/Edit/Delete users
- Manage subscriptions
- Reset passwords
- Send notifications
- Export user data (GDPR compliance)

**Data Views**:
- User profile with exam history
- Subscription status and payment history
- Learning progress across courses
- Cultural knowledge development
- Support interaction history

### 3. Course Management
**Purpose**: Comprehensive course content and structure control

**Course Operations**:
- Create/Edit/Delete courses
- Manage course availability
- Configure cultural contexts
- Set pricing and subscription tiers
- Upload course materials

**Exam Management**:
- Configure exam structures
- Manage question banks
- Set scoring rubrics
- Cultural adaptation settings
- Provider-specific configurations

**Content Management**:
- Course descriptions and metadata
- Cultural context definitions
- Localization settings
- Media asset management
- Learning path configurations

### 4. Payment Management
**Purpose**: Financial oversight and subscription management

**Payment Analytics**:
- Revenue tracking by course/period
- Subscription conversion metrics
- Refund and chargeback management
- Payment method analytics
- Regional revenue insights

**Subscription Management**:
- Active subscription monitoring
- Renewal rate tracking
- Plan upgrade/downgrade handling
- Promotional code management
- Payment failure resolution

**Financial Reporting**:
- Monthly recurring revenue (MRR)
- Customer lifetime value (CLV)
- Churn rate analysis
- Regional payment preferences
- Tax and compliance reporting

### 5. Analytics & Reporting
**Purpose**: Data-driven insights for platform optimization

**User Analytics**:
- Learning behavior patterns
- Exam performance trends
- Cultural knowledge development
- Drop-off point analysis
- Engagement metrics

**Course Analytics**:
- Course completion rates
- Section-wise performance
- Cultural context effectiveness
- Question difficulty analysis
- Time-to-completion metrics

**Business Intelligence**:
- Market penetration by region
- Course popularity trends
- Seasonal enrollment patterns
- Cultural adaptation success rates
- Competitive positioning insights

### 6. System Configuration
**Purpose**: Platform-wide settings and feature toggles

**Configuration Areas**:
- Feature flags and toggles
- Cultural context management
- Language and localization settings
- Email template management
- API rate limiting
- Security configurations

## Permission System

### Role Hierarchy

```typescript
interface AdminRole {
  super_admin: {
    permissions: ['*']; // Full system access
    description: 'Complete platform control';
  };
  admin: {
    permissions: [
      'users.manage',
      'courses.manage', 
      'payments.view',
      'analytics.view',
      'settings.edit'
    ];
    description: 'General administrative access';
  };
  course_manager: {
    permissions: [
      'courses.manage',
      'exams.manage',
      'users.view',
      'analytics.course'
    ];
    description: 'Course content and exam management';
  };
  support: {
    permissions: [
      'users.support',
      'payments.support',
      'analytics.basic'
    ];
    description: 'Customer support functions';
  };
}
```

### Permission Granularity

**Resource-Based Permissions**:
- `users.{view|create|edit|delete|support}`
- `courses.{view|create|edit|delete|publish}`
- `payments.{view|process|refund|export}`
- `analytics.{basic|advanced|export}`
- `settings.{view|edit|admin}`

## Security Architecture

### Authentication Flow
1. **Multi-Factor Authentication**: Required for all admin accounts
2. **Session Management**: Secure session handling with timeout
3. **IP Whitelisting**: Optional IP restriction for sensitive roles
4. **Audit Logging**: Complete action tracking for compliance

### Data Protection
- **Encryption at Rest**: All sensitive data encrypted
- **GDPR Compliance**: User data export and deletion capabilities
- **PII Masking**: Sensitive information masked in logs
- **Secure API**: Rate limiting and input validation

## API Design

### Admin API Endpoints

```typescript
// User Management
GET    /api/admin/users             // List users with filters
GET    /api/admin/users/:id         // Get user details
PUT    /api/admin/users/:id         // Update user
DELETE /api/admin/users/:id         // Delete user
POST   /api/admin/users/:id/notify  // Send notification

// Course Management  
GET    /api/admin/courses           // List courses
POST   /api/admin/courses           // Create course
PUT    /api/admin/courses/:id       // Update course
DELETE /api/admin/courses/:id       // Delete course
POST   /api/admin/courses/:id/publish // Publish course

// Payment Management
GET    /api/admin/payments          // List transactions
GET    /api/admin/payments/stats    // Payment analytics
POST   /api/admin/payments/:id/refund // Process refund
GET    /api/admin/subscriptions     // List subscriptions

// Analytics
GET    /api/admin/analytics/dashboard    // Dashboard metrics
GET    /api/admin/analytics/users        // User analytics
GET    /api/admin/analytics/courses      // Course analytics
GET    /api/admin/analytics/revenue      // Revenue analytics

// System Configuration
GET    /api/admin/settings          // Get all settings
PUT    /api/admin/settings          // Update settings
GET    /api/admin/audit-logs        // View audit logs
```

## UI/UX Design Considerations

### Design System
- **Component Library**: Reusable admin-specific components
- **Responsive Design**: Mobile-friendly admin interface
- **Dark/Light Mode**: Theme support for different preferences
- **Accessibility**: WCAG compliance for admin users

### User Experience
- **Quick Actions**: Shortcuts for common administrative tasks
- **Bulk Operations**: Mass actions for efficiency
- **Advanced Filtering**: Powerful search and filter capabilities
- **Export Functions**: Data export for analysis and compliance

### Performance
- **Lazy Loading**: Efficient data loading for large datasets
- **Caching Strategy**: Optimized caching for frequently accessed data
- **Real-Time Updates**: WebSocket connections for live data
- **Pagination**: Efficient handling of large result sets

## Implementation Phases

### Phase 1: Core Admin Framework
- Basic authentication and authorization
- User management interface
- Course management basics
- Audit logging system

### Phase 2: Payment & Analytics
- Payment management interface
- Basic analytics dashboard
- Subscription management
- Revenue reporting

### Phase 3: Advanced Features
- Advanced analytics and reporting
- System configuration interface
- Cultural context management
- Performance optimization

### Phase 4: Enterprise Features
- Advanced role management
- API rate limiting
- Advanced security features
- Compliance reporting

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: Tailwind CSS + Headless UI
- **State Management**: Zustand or React Query
- **Charts**: Recharts or Chart.js
- **Real-time**: Socket.io client

### Backend
- **API**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### External Services
- **Payments**: Stripe + PayPal integration
- **Email**: SendGrid or similar
- **Analytics**: Custom + Google Analytics
- **Monitoring**: Vercel Analytics + custom metrics

## Deployment & Monitoring

### Infrastructure
- **Hosting**: Vercel for frontend and API
- **Database**: Supabase managed PostgreSQL
- **CDN**: Vercel Edge Network
- **Monitoring**: Real-time performance monitoring

### Security Monitoring
- **Intrusion Detection**: Failed login attempt tracking
- **Activity Monitoring**: Suspicious admin activity detection
- **Compliance**: GDPR and data protection compliance
- **Backup Strategy**: Regular automated backups

This architecture provides a comprehensive foundation for managing the NeoLingus platform while maintaining security, scalability, and user experience standards.