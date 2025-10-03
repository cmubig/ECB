# ECB Admin Dashboard

## 🔐 Admin Access

### Admin Credentials
- **Email**: `admin@ecb.com`
- **Password**: `ecbadmin`
- **URL**: `/ecb-admin`

### Features

#### 1. **User Management Dashboard**
- **Real-time User Progress**: Live tracking of all users' completion status
- **User Details**: Individual user progress, time spent, and response history
- **Country-wise Analytics**: Progress breakdown by country
- **Completion Rates**: Visual progress bars and completion percentages

#### 2. **Analytics & Statistics**
- **Country Statistics**: User activity and completion rates by country
- **Model Performance**: Average scores and response counts by model
- **Summary Metrics**: Total users, active users, completion rates
- **Time Analysis**: Average time spent per user session

#### 3. **Real-time Monitoring**
- **Live Updates**: Real-time data from Firebase
- **User Activity**: Last activity timestamps
- **Progress Tracking**: Step-by-step completion tracking
- **Response Monitoring**: Individual response details

## 🚀 Setup Instructions

### 1. Create Admin User
```bash
# Navigate to the project directory
cd ecb-human-survey

# Install dependencies (if not already installed)
npm install

# Create admin user in Firebase
node scripts/create-admin.js
```

### 2. Access Admin Dashboard
1. Go to `http://localhost:3000/ecb-admin`
2. Login with admin credentials:
   - Email: `admin@ecb.com`
   - Password: `ecbadmin`

### 3. Admin Features

#### User Progress View
- **Overview Tab**: Table view of all users with progress bars
- **User Details Tab**: Detailed information for selected users
- **Real-time Updates**: Automatic refresh of user data

#### Analytics View
- **Country Statistics**: Performance metrics by country
- **Model Performance**: Model evaluation scores
- **Summary Cards**: Key metrics and statistics

#### Settings View
- **System Information**: Database and connection status
- **Data Management**: Export and backup options

## 📊 Dashboard Components

### User Progress Dashboard
- **User List**: All users with completion status
- **Progress Bars**: Visual completion indicators
- **Status Badges**: Completed, In Progress, Started
- **Time Tracking**: Total time spent per user
- **Last Activity**: Recent user activity timestamps

### Analytics Dashboard
- **Country Breakdown**: Users and responses by country
- **Model Performance**: Average scores by model
- **Completion Rates**: Overall completion statistics
- **Time Analysis**: Average session duration

### Real-time Features
- **Live Updates**: Automatic data refresh
- **Real-time Indicators**: Active status indicators
- **Progress Tracking**: Live progress monitoring
- **Activity Monitoring**: User activity timestamps

## 🔧 Technical Details

### Authentication
- **Admin-only Access**: Restricted to `admin@ecb.com`
- **Secure Login**: Firebase Authentication
- **Session Management**: Automatic logout on browser close

### Data Sources
- **Firebase Firestore**: Real-time database
- **Collections**: `attribution_responses`, `survey_responses`, `user_profiles`
- **Real-time Updates**: Live data synchronization

### Security
- **Admin-only Routes**: Protected admin routes
- **Email Validation**: Admin email verification
- **Secure Access**: Authentication required for all admin features

## 📈 Usage Examples

### Monitoring User Progress
1. Go to **Users** tab
2. View **Overview** for all users
3. Click **View** button for detailed user information
4. Monitor real-time progress updates

### Analyzing Statistics
1. Go to **Analytics** tab
2. View **Country Statistics** for regional analysis
3. Check **Model Performance** for evaluation scores
4. Review **Summary Cards** for key metrics

### Managing Data
1. Go to **Settings** tab
2. Check **System Information** for status
3. Use **Data Management** for exports and backups

## 🛠️ Development

### Adding New Features
1. Create components in `src/components/admin/`
2. Add routes in `src/app/ecb-admin/`
3. Update context in `src/contexts/AdminContext.tsx`

### Customizing Dashboard
1. Modify `AdminDashboard.tsx` for layout changes
2. Update `UserProgressDashboard.tsx` for user views
3. Customize `AdminStats.tsx` for analytics

## 🔒 Security Notes

- **Admin Access Only**: Dashboard is restricted to admin users
- **Secure Authentication**: Firebase Authentication with email verification
- **Protected Routes**: All admin routes require authentication
- **Data Privacy**: User data is securely stored and accessed

## 📞 Support

For admin dashboard issues or questions:
1. Check Firebase connection status
2. Verify admin credentials
3. Ensure proper authentication setup
4. Review console for error messages

---

**Note**: This admin dashboard provides comprehensive monitoring and analytics for the ECB human evaluation system. All data is real-time and securely managed through Firebase.
