import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
// import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  CheckCircle, 
  // Clock, 
  Globe, 
  BarChart3, 
  TrendingUp,
  User,
  Calendar,
  Timer,
  ChevronDown,
  Search
} from 'lucide-react';

interface UserProgress {
  userId: string;
  userName?: string;
  userEmail?: string;
  country: string;
  totalSteps: number;
  completedSteps: number;
  completionRate: number;
  lastActivity: string;
  totalTime: number;
  responses: Record<string, unknown>[];
  modelProgress: {
    [model: string]: {
      completed: number;
      total: number;
      percentage: number;
    };
  };
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  completedUsers: number;
  averageCompletionRate: number;
  totalResponses: number;
  countries: string[];
}

const UserProgressDashboard: React.FC = () => {
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    completedUsers: 0,
    averageCompletionRate: 0,
    totalResponses: 0,
    countries: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProgress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        // Get all user data from multiple collections
        const attributionQuery = query(
          collection(db, 'attribution_responses'),
          orderBy('timestamp', 'desc')
        );

        const surveyQuery = query(
          collection(db, 'survey_responses'),
          orderBy('timestamp', 'desc')
        );

        const stepQuery = query(
          collection(db, 'step_responses'),
          orderBy('timestamp', 'desc')
        );

        const userProfilesQuery = query(
          collection(db, 'user_profiles'),
          orderBy('created_at', 'desc')
        );

        // Combine all data sources
        const unsubscribeAttribution = onSnapshot(attributionQuery, (attributionSnapshot) => {
          const unsubscribeSurvey = onSnapshot(surveyQuery, (surveySnapshot) => {
            const unsubscribeStep = onSnapshot(stepQuery, (stepSnapshot) => {
              const unsubscribeProfiles = onSnapshot(userProfilesQuery, (profilesSnapshot) => {
                const userMap = new Map<string, UserProgress>();
                const countries = new Set<string>();
                let totalResponses = 0;

                // Process attribution responses
                attributionSnapshot.forEach((doc) => {
                  const data = doc.data();
                  const userId = data.user_id;
                  const country = data.country;
                  
                  countries.add(country);
                  totalResponses++;

                  if (!userMap.has(userId)) {
                    userMap.set(userId, {
                      userId,
                      country,
                      totalSteps: 0,
                      completedSteps: 0,
                      completionRate: 0,
                      lastActivity: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
                      totalTime: 0,
                      responses: [],
                      modelProgress: {}
                    });
                  }

                  const user = userMap.get(userId)!;
                  user.totalSteps++;
                  user.completedSteps++;
                  user.totalTime += data.completion_time_seconds || 0;
                  user.responses.push({...data, type: 'attribution'});
                  user.lastActivity = data.timestamp?.toDate?.()?.toISOString() || user.lastActivity;
                });

                // Process survey responses
                surveySnapshot.forEach((doc) => {
                  const data = doc.data();
                  const userId = data.user_id;
                  const country = data.country || 'Unknown';
                  
                  countries.add(country);
                  totalResponses++;

                  if (!userMap.has(userId)) {
                    userMap.set(userId, {
                      userId,
                      country,
                      totalSteps: 0,
                      completedSteps: 0,
                      completionRate: 0,
                      lastActivity: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
                      totalTime: 0,
                      responses: [],
                      modelProgress: {}
                    });
                  }

                  const user = userMap.get(userId)!;
                  user.totalSteps++;
                  user.completedSteps++;
                  user.totalTime += data.completion_time_seconds || 0;
                  user.responses.push({...data, type: 'survey'});
                  user.lastActivity = data.timestamp?.toDate?.()?.toISOString() || user.lastActivity;
                });

                // Process step responses
                stepSnapshot.forEach((doc) => {
                  const data = doc.data();
                  const userId = data.user_id;
                  const country = data.country || 'Unknown';
                  const model = data.model;
                  
                  countries.add(country);
                  totalResponses++;

                  if (!userMap.has(userId)) {
                    userMap.set(userId, {
                      userId,
                      country,
                      totalSteps: 0,
                      completedSteps: 0,
                      completionRate: 0,
                      lastActivity: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
                      totalTime: 0,
                      responses: [],
                      modelProgress: {}
                    });
                  }

                  const user = userMap.get(userId)!;
                  user.totalSteps++;
                  user.completedSteps++;
                  user.totalTime += data.completion_time_seconds || 0;
                  user.responses.push({...data, type: 'step'});
                  user.lastActivity = data.timestamp?.toDate?.()?.toISOString() || user.lastActivity;

                  // Update model-specific progress (only for valid models)
                  if (model && model !== 'undefined' && model.trim() !== '') {
                    if (!user.modelProgress[model]) {
                      user.modelProgress[model] = { completed: 0, total: 312, percentage: 0 }; // 78 rows * 4 images = 312 per model
                    }
                    user.modelProgress[model].completed++;
                    user.modelProgress[model].percentage = (user.modelProgress[model].completed / 312) * 100;
                  }
                });

                // Process attribution responses
                attributionSnapshot.forEach((doc) => {
                  const data = doc.data();
                  const userId = data.user_id;
                  const country = data.country || 'Unknown';
                  const model = data.model; // Extract model from attribution response
                  
                  countries.add(country);
                  totalResponses++;

                  if (!userMap.has(userId)) {
                    userMap.set(userId, {
                      userId,
                      country,
                      totalSteps: 0,
                      completedSteps: 0,
                      completionRate: 0,
                      lastActivity: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
                      totalTime: 0,
                      responses: [],
                      modelProgress: {}
                    });
                  }

                  const user = userMap.get(userId)!;
                  user.totalSteps++;
                  user.completedSteps++;
                  user.totalTime += data.completion_time_seconds || 0;
                  user.responses.push({...data, type: 'attribution'});
                  user.lastActivity = data.timestamp?.toDate?.()?.toISOString() || user.lastActivity;

                  // Update model-specific progress (only for valid models)
                  if (model && model !== 'undefined' && model.trim() !== '') {
                    if (!user.modelProgress[model]) {
                      user.modelProgress[model] = { completed: 0, total: 312, percentage: 0 }; // 78 rows * 4 images = 312 per model
                    }
                    user.modelProgress[model].completed++;
                    user.modelProgress[model].percentage = (user.modelProgress[model].completed / 312) * 100;
                  }
                });

                // Process user profiles
                profilesSnapshot.forEach((doc) => {
                  const data = doc.data();
                  const userId = data.user_id;
                  const country = data.selected_country || 'Unknown';
                  
                  countries.add(country);

                  if (!userMap.has(userId)) {
                    userMap.set(userId, {
                      userId,
                      userName: data.display_name || data.name || 'Unknown User',
                      userEmail: data.email || 'No email',
                      country,
                      totalSteps: 0,
                      completedSteps: 0,
                      completionRate: 0,
                      lastActivity: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
                      totalTime: 0,
                      responses: [],
                      modelProgress: {}
                    });
                  } else {
                    // Update user info if we have a profile
                    const user = userMap.get(userId)!;
                    user.country = country;
                    user.userName = data.display_name || data.name || user.userName || 'Unknown User';
                    user.userEmail = data.email || user.userEmail || 'No email';
                  }
                });

                // Calculate completion rates based on actual responses
                const progressArray = Array.from(userMap.values()).map(user => {
                  // Ensure modelProgress is initialized
                  if (!user.modelProgress) {
                    user.modelProgress = {};
                  }
                  
                  // Calculate actual completion rate based on responses
                  // Each model has 78 rows * 4 images = 312 images, so total possible = 5 models * 312 = 1,560 images
                  const totalPossibleImages = 5 * 78 * 4; // 5 models * 78 rows * 4 images = 1,560
                  const actualCompletedImages = user.completedSteps; // This is the actual number of images evaluated
                  user.completionRate = totalPossibleImages > 0 ? (actualCompletedImages / totalPossibleImages) * 100 : 0;
                  return user;
                });

                const activeUsers = progressArray.filter(user => 
                  new Date(user.lastActivity) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                ).length;
                const completedUsers = progressArray.filter(user => user.completionRate >= 100).length;
                const averageCompletionRate = progressArray.length > 0 ? 
                  progressArray.reduce((sum, user) => sum + user.completionRate, 0) / progressArray.length : 0;

                setUserProgress(progressArray);
                setUserStats({
                  totalUsers: progressArray.length,
                  activeUsers,
                  completedUsers,
                  averageCompletionRate,
                  totalResponses,
                  countries: Array.from(countries)
                });
                setLoading(false);
              });

              return () => unsubscribeProfiles();
            });

            return () => unsubscribeStep();
          });

          return () => unsubscribeSurvey();
        });

        return () => unsubscribeAttribution();
      } catch (error) {
        console.error('Error fetching user progress:', error);
        setLoading(false);
      }
    };

    fetchUserProgress();
  }, []);

  const getCompletionStatus = (rate: number, completedSteps: number) => {
    if (rate >= 100) return { label: 'All Models Complete', variant: 'default' as const };
    if (completedSteps >= 78) return { label: '1+ Models Complete', variant: 'secondary' as const };
    if (completedSteps > 0) return { label: 'In Progress', variant: 'outline' as const };
    return { label: 'Started', variant: 'outline' as const };
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.countries.length} countries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.completedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((userStats.completedUsers / userStats.totalUsers) * 100).toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              Average: {(userStats.totalResponses / userStats.totalUsers).toFixed(1)} per user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Progress</CardTitle>
          <CardDescription>
            Real-time progress tracking for all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">User Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Country</th>
                      <th className="text-left p-2">Models Progress</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Time Spent</th>
                      <th className="text-left p-2">Last Activity</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userProgress.map((user) => {
                      const status = getCompletionStatus(user.completionRate, user.completedSteps);
                      return (
                        <tr key={user.userId} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="space-y-1">
                              <div className="font-medium">{user.userName || 'Unknown User'}</div>
                              <div className="text-sm text-gray-500">{user.userEmail || 'No email'}</div>
                              <div className="text-xs text-gray-400 font-mono">{user.userId.slice(0, 8)}...</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4" />
                              <span>{user.country}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>{user.completedSteps}/1,560 images</span>
                                <span>{user.completionRate.toFixed(1)}%</span>
                              </div>
                              <Progress value={user.completionRate} className="h-2" />
                              
                              {/* Model-specific progress */}
                              {user.modelProgress && Object.keys(user.modelProgress).length > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500">
                                    {Object.keys(user.modelProgress).length} models started
                                  </div>
                                  <div className="grid grid-cols-2 gap-1">
                                    {Object.entries(user.modelProgress)
                                      .filter(([model, _]) => model && model !== 'undefined' && model.trim() !== '')
                                      .map(([model, progress]) => (
                                      <div key={model} className="text-xs">
                                        <div className="flex justify-between">
                                          <span className="capitalize">{model}</span>
                                          <span className={progress.percentage >= 100 ? 'text-green-600' : 'text-gray-500'}>
                                            {progress.percentage.toFixed(0)}%
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1">
                                          <div 
                                            className={`h-1 rounded-full ${progress.percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">No models started</div>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center space-x-1">
                              <Timer className="h-4 w-4" />
                              <span className="text-sm">{formatTime(user.totalTime)}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">{formatDate(user.lastActivity)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              {/* User Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select User to View Details</CardTitle>
                  <CardDescription>
                    Choose a user from the list to view their detailed progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search users by name, email, or country..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {(() => {
                        const filteredUsers = userProgress.filter((user) => {
                          if (!searchTerm) return true;
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            user.userName?.toLowerCase().includes(searchLower) ||
                            user.userEmail?.toLowerCase().includes(searchLower) ||
                            user.country?.toLowerCase().includes(searchLower) ||
                            user.userId.toLowerCase().includes(searchLower)
                          );
                        });

                        if (filteredUsers.length === 0) {
                          return (
                            <div className="col-span-full text-center py-8 text-gray-500">
                              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>No users found matching your search.</p>
                            </div>
                          );
                        }

                        return filteredUsers.map((user) => (
                        <div
                          key={user.userId}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedUser?.userId === user.userId 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {user.userName?.charAt(0)?.toUpperCase() || user.userId.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {user.userName || 'Unknown User'}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {user.userEmail || 'No email'}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-400">{user.country}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-400">{user.completionRate.toFixed(1)}%</span>
                              </div>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        ));
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedUser ? (
                <Card>
                  <CardHeader>
                    <CardTitle>User Details: {selectedUser.userName || 'Unknown User'}</CardTitle>
                    <CardDescription>
                      {selectedUser.userEmail || 'No email'} • {selectedUser.country} • {selectedUser.userId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">User Name</label>
                        <p className="text-sm text-muted-foreground">{selectedUser.userName || 'Unknown User'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-muted-foreground">{selectedUser.userEmail || 'No email'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">User ID</label>
                        <p className="text-sm text-muted-foreground font-mono">{selectedUser.userId}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Country</label>
                        <p className="text-sm text-muted-foreground">{selectedUser.country}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Completion Rate</label>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.completionRate.toFixed(1)}% ({selectedUser.completedSteps}/1,560 images)
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Total Time</label>
                        <p className="text-sm text-muted-foreground">{formatTime(selectedUser.totalTime)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Activity</label>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedUser.lastActivity)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Models Completed</label>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(selectedUser.completedSteps / 312)}/5 models
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Current Progress</label>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.completedSteps % 312 === 0 ? 'Starting new model' : 
                           `Model ${Math.floor(selectedUser.completedSteps / 312) + 1}: ${selectedUser.completedSteps % 312}/312 images`}
                        </p>
                      </div>
                    </div>

                    {/* Model-specific progress */}
                    {selectedUser.modelProgress && Object.keys(selectedUser.modelProgress).length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Model Progress</label>
                        <div className="mt-2 space-y-2">
                          {Object.entries(selectedUser.modelProgress)
                            .filter(([model, _]) => model && model !== 'undefined' && model.trim() !== '')
                            .map(([model, progress]) => (
                            <div key={model} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium capitalize">{model}</span>
                                <Badge variant={progress.percentage >= 100 ? 'default' : 'secondary'}>
                                  {progress.percentage.toFixed(1)}%
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{progress.completed}/{progress.total} images</span>
                                  <span>{progress.percentage.toFixed(1)}%</span>
                                </div>
                                <Progress value={progress.percentage} className="h-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Response Type Breakdown */}
                    <div>
                      <label className="text-sm font-medium">Response Breakdown</label>
                      <div className="mt-2 grid grid-cols-3 gap-4">
                        <div className="p-3 border rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedUser.responses.filter(r => r.type === 'step').length}
                          </div>
                          <div className="text-sm text-gray-500">Step Responses</div>
                        </div>
                        <div className="p-3 border rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedUser.responses.filter(r => r.type === 'attribution').length}
                          </div>
                          <div className="text-sm text-gray-500">Attribution Responses</div>
                        </div>
                        <div className="p-3 border rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {selectedUser.responses.filter(r => r.type === 'survey').length}
                          </div>
                          <div className="text-sm text-gray-500">Survey Responses</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">All Responses ({selectedUser.responses.length})</label>
                      <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                        {selectedUser.responses.map((response, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {String((response as Record<string, unknown>).type) || 'response'}
                                  </Badge>
                                  <p className="text-sm font-medium">
                                    {String((response as Record<string, unknown>).question_id) || String((response as Record<string, unknown>).model) || 'Response'}
                                  </p>
                                </div>
                                {Boolean((response as Record<string, unknown>).model) && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Model: {String((response as Record<string, unknown>).model)}
                                  </p>
                                )}
                                {Boolean((response as Record<string, unknown>).category) && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Category: {String((response as Record<string, unknown>).category)}
                                  </p>
                                )}
                                {Boolean((response as Record<string, unknown>).step) && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Step: {String((response as Record<string, unknown>).step)}
                                  </p>
                                )}
                                {Boolean((response as Record<string, unknown>).image_quality) && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Quality: {String((response as Record<string, unknown>).image_quality)}/5
                                  </p>
                                )}
                                {Boolean((response as Record<string, unknown>).cultural_representative) && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Cultural: {String((response as Record<string, unknown>).cultural_representative)}/5
                                  </p>
                                )}
                                {Boolean((response as Record<string, unknown>).comments) && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Comments: {String((response as Record<string, unknown>).comments)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-sm">
                                  {response.completion_time_seconds ? 
                                    `${response.completion_time_seconds}s` : 'N/A'
                                  }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {((response as Record<string, unknown>).timestamp as { toDate?: () => Date })?.toDate?.()?.toLocaleString() || 'Unknown time'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a user to view details</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProgressDashboard;
