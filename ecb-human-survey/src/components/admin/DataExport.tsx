import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Download, 
  FileText, 
  Database, 
  Clock
} from 'lucide-react';

interface ExportData {
  userId: string;
  userName?: string;
  userEmail?: string;
  country: string;
  model: string;
  imageId: string;
  step: string;
  imageQuality: number;
  culturalRepresentation: number;
  bestImage: string;
  worstImage: string;
  timestamp: string;
  completionTime: number;
  responseType: string;
}

const DataExport: React.FC = () => {
  const [exportData, setExportData] = useState<ExportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportStats, setExportStats] = useState({
    totalResponses: 0,
    uniqueUsers: 0,
    countries: 0,
    models: 0,
    dateRange: { start: '', end: '' }
  });

  useEffect(() => {
    const fetchExportData = async () => {
      setLoading(true);
      try {
        const allData: ExportData[] = [];
        const userIds = new Set<string>();
        const countries = new Set<string>();
        const models = new Set<string>();
        let earliestDate = new Date();
        let latestDate = new Date(0);

        // Helper function to get user profile
        const getUserProfile = async (userId: string) => {
          try {
            const userDoc = await getDoc(doc(db, 'user_profiles', userId));
            if (userDoc.exists()) {
              const data = userDoc.data();
              return {
                userName: data?.display_name || data?.name || 'Unknown User',
                userEmail: data?.email || 'No email'
              };
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
          return {
            userName: 'Unknown User',
            userEmail: 'No email'
          };
        };

        // Fetch step responses
        const stepQuery = query(collection(db, 'step_responses'), orderBy('timestamp', 'desc'));
        const stepUnsubscribe = onSnapshot(stepQuery, async (snapshot) => {
          console.log('📝 Processing step responses...', snapshot.size, 'responses found');
          const stepPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const timestamp = data.timestamp?.toDate?.() || new Date();
            const userProfile = await getUserProfile(data.user_id);
            
            console.log('🔍 Looking up user profile for:', data.user_id, 'Found:', userProfile);
            
            if (timestamp < earliestDate) earliestDate = timestamp;
            if (timestamp > latestDate) latestDate = timestamp;

            return {
              userId: data.user_id,
              userName: userProfile.userName,
              userEmail: userProfile.userEmail,
              country: data.country || 'Unknown',
              model: data.model || 'Unknown',
              imageId: data.uid || doc.id,
              step: data.step || 'Unknown',
              imageQuality: data.image_quality || 0,
              culturalRepresentation: data.cultural_representative || 0,
              bestImage: data.is_best ? data.step : '',
              worstImage: data.is_worst ? data.step : '',
              timestamp: timestamp.toISOString(),
              completionTime: data.completion_time_seconds || 0,
              responseType: 'step'
            };
          });

          const stepData = await Promise.all(stepPromises);
          allData.push(...stepData);
          
          stepData.forEach(item => {
            userIds.add(item.userId);
            countries.add(item.country);
            models.add(item.model);
          });
        });

        // Fetch attribution responses
        const attributionQuery = query(collection(db, 'attribution_responses'), orderBy('timestamp', 'desc'));
        const attributionUnsubscribe = onSnapshot(attributionQuery, async (snapshot) => {
          const attributionPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const timestamp = data.timestamp?.toDate?.() || new Date();
            const userProfile = await getUserProfile(data.user_id);
            
            if (timestamp < earliestDate) earliestDate = timestamp;
            if (timestamp > latestDate) latestDate = timestamp;

            return {
              userId: data.user_id,
              userName: userProfile.userName,
              userEmail: userProfile.userEmail,
              country: data.country || 'Unknown',
              model: 'attribution', // attribution responses don't have specific models
              imageId: doc.id,
              step: 'attribution',
              imageQuality: 0, // attribution responses don't have image quality scores
              culturalRepresentation: 0, // attribution responses don't have cultural representation scores
              bestImage: '', // attribution responses don't have best/worst selections
              worstImage: '',
              timestamp: timestamp.toISOString(),
              completionTime: data.completion_time_seconds || 0,
              responseType: 'attribution'
            };
          });

          const attributionData = await Promise.all(attributionPromises);
          allData.push(...attributionData);
          
          attributionData.forEach(item => {
            userIds.add(item.userId);
            countries.add(item.country);
            models.add(item.model);
          });
        });

        // Fetch survey responses
        const surveyQuery = query(collection(db, 'survey_responses'), orderBy('timestamp', 'desc'));
        const surveyUnsubscribe = onSnapshot(surveyQuery, async (snapshot) => {
          const surveyPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const timestamp = data.timestamp?.toDate?.() || new Date();
            const userProfile = await getUserProfile(data.user_id);
            
            if (timestamp < earliestDate) earliestDate = timestamp;
            if (timestamp > latestDate) latestDate = timestamp;

            return {
              userId: data.user_id,
              userName: userProfile.userName,
              userEmail: userProfile.userEmail,
              country: data.country || 'Unknown',
              model: data.model || 'Unknown',
              imageId: doc.id,
              step: 'survey',
              imageQuality: data.image_quality || 0,
              culturalRepresentation: data.cultural_representative || 0,
              bestImage: data.best_step ? `step${data.best_step}` : '',
              worstImage: data.worst_step ? `step${data.worst_step}` : '',
              timestamp: timestamp.toISOString(),
              completionTime: data.completion_time_seconds || 0,
              responseType: 'survey'
            };
          });

          const surveyData = await Promise.all(surveyPromises);
          allData.push(...surveyData);
          
          surveyData.forEach(item => {
            userIds.add(item.userId);
            countries.add(item.country);
            models.add(item.model);
          });

          setExportData(allData);
          setExportStats({
            totalResponses: allData.length,
            uniqueUsers: userIds.size,
            countries: countries.size,
            models: models.size,
            dateRange: {
              start: earliestDate.toISOString().split('T')[0],
              end: latestDate.toISOString().split('T')[0]
            }
          });
          setLoading(false);
        });

        return () => {
          stepUnsubscribe();
          attributionUnsubscribe();
          surveyUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching export data:', error);
        setLoading(false);
      }
    };

    fetchExportData();
  }, []);

  const downloadCSV = () => {
    if (exportData.length === 0) return;

    const headers = [
      'User ID', 'User Name', 'User Email', 'Country', 'Model', 'Image ID', 'Step',
      'Image Quality (1-5)', 'Cultural Representation (1-5)', 'Best Image', 'Worst Image',
      'Timestamp', 'Completion Time (seconds)', 'Response Type'
    ];

    const csvContent = [
      headers.join(','),
      ...exportData.map(row => [
        row.userId,
        `"${row.userName || ''}"`,
        `"${row.userEmail || ''}"`,
        row.country,
        row.model,
        row.imageId,
        row.step,
        row.imageQuality,
        row.culturalRepresentation,
        `"${row.bestImage}"`,
        `"${row.worstImage}"`,
        row.timestamp,
        row.completionTime,
        row.responseType
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `human_evaluation_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSummaryCSV = () => {
    if (exportData.length === 0) return;

    // Calculate summary statistics
    const summaryData = exportData.reduce((acc, row) => {
      const key = `${row.model}_${row.country}`;
      if (!acc[key]) {
        acc[key] = {
          model: row.model,
          country: row.country,
          totalResponses: 0,
          avgImageQuality: 0,
          avgCulturalRepresentation: 0,
          bestImageCounts: {},
          worstImageCounts: {}
        };
      }
      
      acc[key].totalResponses++;
      acc[key].avgImageQuality += row.imageQuality;
      acc[key].avgCulturalRepresentation += row.culturalRepresentation;
      
      if (row.bestImage) {
        acc[key].bestImageCounts[row.bestImage] = (acc[key].bestImageCounts[row.bestImage] || 0) + 1;
      }
      if (row.worstImage) {
        acc[key].worstImageCounts[row.worstImage] = (acc[key].worstImageCounts[row.worstImage] || 0) + 1;
      }
      
      return acc;
    }, {} as Record<string, {
      model: string;
      country: string;
      totalResponses: number;
      avgImageQuality: number;
      avgCulturalRepresentation: number;
      bestImageCounts: Record<string, number>;
      worstImageCounts: Record<string, number>;
    }>);

    // Calculate averages
    Object.values(summaryData).forEach((summary) => {
      summary.avgImageQuality = Number((summary.avgImageQuality / summary.totalResponses).toFixed(2));
      summary.avgCulturalRepresentation = Number((summary.avgCulturalRepresentation / summary.totalResponses).toFixed(2));
    });

    const headers = [
      'Model', 'Country', 'Total Responses', 'Avg Image Quality', 'Avg Cultural Representation',
      'Most Selected Best', 'Most Selected Worst'
    ];

    const csvContent = [
      headers.join(','),
      ...Object.values(summaryData).map((summary) => [
        summary.model,
        summary.country,
        summary.totalResponses,
        summary.avgImageQuality,
        summary.avgCulturalRepresentation,
        Object.keys(summary.bestImageCounts).reduce((a, b) => summary.bestImageCounts[a] > summary.bestImageCounts[b] ? a : b, ''),
        Object.keys(summary.worstImageCounts).reduce((a, b) => summary.worstImageCounts[a] > summary.worstImageCounts[b] ? a : b, '')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `human_evaluation_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Human Evaluation Data Export</span>
          </CardTitle>
          <CardDescription>
            Export human evaluation data for comparison with quantitative metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{exportStats.totalResponses}</div>
              <div className="text-sm text-gray-500">Total Responses</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{exportStats.uniqueUsers}</div>
              <div className="text-sm text-gray-500">Unique Users</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{exportStats.countries}</div>
              <div className="text-sm text-gray-500">Countries</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{exportStats.models}</div>
              <div className="text-sm text-gray-500">Models</div>
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Data Range: {exportStats.dateRange.start} to {exportStats.dateRange.end}</span>
          </div>

          {/* Export Buttons */}
          <div className="flex space-x-4">
            <Button 
              onClick={downloadCSV} 
              disabled={loading || exportData.length === 0}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Full Data CSV</span>
            </Button>
            <Button 
              onClick={downloadSummaryCSV} 
              disabled={loading || exportData.length === 0}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Download Summary CSV</span>
            </Button>
          </div>

          {loading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading data...</span>
            </div>
          )}

          {exportData.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No data available for export.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataExport;
