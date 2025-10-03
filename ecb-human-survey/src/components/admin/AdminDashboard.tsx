import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield,
  Activity,
  // Globe,
  Clock,
  Download,
  Target
} from 'lucide-react';
import UserProgressDashboard from './UserProgressDashboard';
import AdminStats from './AdminStats';
import DataExport from './DataExport';
import QuantitativeQualitativeComparison from './QuantitativeQualitativeComparison';
import BestWorstAnalysis from './BestWorstAnalysis';

const AdminDashboard: React.FC = () => {
  const { logout } = useAdmin();
  const [activeTab, setActiveTab] = useState('users');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">ECB Admin Dashboard</h1>
                  <p className="text-sm text-gray-500">Cultural Bias Evaluation Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Activity className="h-4 w-4" />
                <span>Real-time</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="bestworst" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Best/Worst</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Data Export</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Comparison</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <p className="text-gray-600">Monitor user progress and activity in real-time</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            <UserProgressDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics & Statistics</h2>
                <p className="text-gray-600">Comprehensive analysis of user behavior and responses</p>
              </div>
            </div>
            <AdminStats />
          </TabsContent>

          <TabsContent value="bestworst" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Best/Worst Step Analysis</h2>
                <p className="text-gray-600">Analyze which steps are most frequently selected as best and worst</p>
              </div>
            </div>
            <BestWorstAnalysis />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Data Export</h2>
                <p className="text-gray-600">Export human evaluation data for analysis</p>
              </div>
            </div>
            <DataExport />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Quantitative vs Qualitative Analysis</h2>
                <p className="text-gray-600">Compare human evaluation with automated metrics</p>
              </div>
            </div>
            <QuantitativeQualitativeComparison />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
                <p className="text-gray-600">Configure system parameters and preferences</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Current system status and configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Database Status</span>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Real-time Updates</span>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Admin Access</span>
                    <span className="text-sm text-green-600">Authenticated</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Manage user data and system resources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Export User Data
                  </Button>
                  <Button variant="outline" className="w-full">
                    Generate Reports
                  </Button>
                  <Button variant="outline" className="w-full">
                    System Backup
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
