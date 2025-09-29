'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStepResponses } from '@/lib/firestore';
import { StepResponse } from '@/types/survey';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Database } from 'lucide-react';
import { toast } from 'sonner';

const MODELS = ['flux', 'hidream', 'nextstep', 'qwen', 'sd35'];
const COUNTRIES = ['China', 'India', 'Kenya', 'Korea', 'Nigeria', 'United States'];

// Admin emails (you can configure this)
const ADMIN_EMAILS = ['your-admin-email@gmail.com']; // Replace with actual admin emails

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [stepResponses, setStepResponses] = useState<StepResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<StepResponse[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [loadingData, setLoadingData] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user?.email && ADMIN_EMAILS.includes(user.email)) {
      setIsAdmin(true);
    }
  }, [user]);

  // Load all step responses
  useEffect(() => {
    const loadData = async () => {
      if (!isAdmin) return;
      
      setLoadingData(true);
      try {
        const responses = await getStepResponses();
        setStepResponses(responses);
        setFilteredResponses(responses);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [isAdmin]);

  // Filter responses
  useEffect(() => {
    let filtered = stepResponses;
    
    if (selectedModel !== 'all') {
      filtered = filtered.filter(r => r.model === selectedModel);
    }
    
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(r => r.country === selectedCountry);
    }
    
    setFilteredResponses(filtered);
  }, [stepResponses, selectedModel, selectedCountry]);

  const exportToCSV = () => {
    if (filteredResponses.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create CSV header matching cultural_metrics_summary.csv format
    const headers = [
      'uid',
      'group_id', 
      'step',
      'country',
      'category',
      'sub_category',
      'variant',
      'user_id',
      'model',
      'prompt',
      'editing_prompt',
      'image_url',
      'cultural_representative',
      'prompt_alignment',
      'is_best',
      'is_worst',
      'comments',
      'timestamp',
      'completion_time_seconds'
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers.join(','),
      ...filteredResponses.map(response => [
        response.uid,
        response.group_id,
        response.step,
        response.country.toLowerCase(),
        response.category,
        response.sub_category,
        response.variant,
        response.user_id,
        response.model,
        `"${response.prompt}"`,
        `"${response.editing_prompt}"`,
        response.image_url,
        response.cultural_representative,
        response.prompt_alignment,
        response.is_best,
        response.is_worst,
        response.comments ? `"${response.comments}"` : '',
        response.timestamp.toISOString(),
        response.completion_time_seconds
      ].join(','))
    ];

    // Create and download file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const filename = `human_survey_responses_${selectedModel !== 'all' ? selectedModel : 'all_models'}_${selectedCountry !== 'all' ? selectedCountry.toLowerCase() : 'all_countries'}_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${filteredResponses.length} responses to ${filename}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please sign in to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access this page.</p>
            <p className="text-sm text-gray-600 mt-2">
              Contact the administrator if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Survey Data Admin</h1>
            <p className="text-gray-600">Export and analyze human survey responses</p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Database className="w-4 h-4 mr-1" />
            Admin Panel
          </Badge>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Data Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {MODELS.map(model => (
                      <SelectItem key={model} value={model}>
                        {model.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Country</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading data...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stepResponses.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Responses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredResponses.length}
                  </div>
                  <div className="text-sm text-gray-600">Filtered Results</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(stepResponses.map(r => r.user_id)).size}
                  </div>
                  <div className="text-sm text-gray-600">Unique Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(stepResponses.map(r => r.group_id)).size}
                  </div>
                  <div className="text-sm text-gray-600">Question Groups</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Export filtered data in CSV format compatible with cultural_metrics_summary.csv structure.
                Each row represents one image step with individual ratings and best/worst selections.
              </p>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">
                    Ready to export {filteredResponses.length} step responses
                  </div>
                  <div className="text-sm text-gray-600">
                    Model: {selectedModel === 'all' ? 'All Models' : selectedModel.toUpperCase()} • 
                    Country: {selectedCountry === 'all' ? 'All Countries' : selectedCountry}
                  </div>
                </div>
                <Button 
                  onClick={exportToCSV}
                  disabled={filteredResponses.length === 0 || loadingData}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Data Preview */}
        {filteredResponses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sample Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">UID</th>
                      <th className="text-left p-2">Step</th>
                      <th className="text-left p-2">Model</th>
                      <th className="text-left p-2">Country</th>
                      <th className="text-left p-2">Prompt Align</th>
                      <th className="text-left p-2">Cultural Rep</th>
                      <th className="text-left p-2">Best</th>
                      <th className="text-left p-2">Worst</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.slice(0, 5).map((response, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-mono text-xs">{response.uid}</td>
                        <td className="p-2">{response.step}</td>
                        <td className="p-2">{response.model}</td>
                        <td className="p-2">{response.country}</td>
                        <td className="p-2">{response.prompt_alignment}</td>
                        <td className="p-2">{response.cultural_representative}</td>
                        <td className="p-2">{response.is_best ? '✓' : ''}</td>
                        <td className="p-2">{response.is_worst ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredResponses.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Showing 5 of {filteredResponses.length} responses
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
