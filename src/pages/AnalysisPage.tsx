import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, LineChart, PieChart, Activity } from 'lucide-react';

const AnalysisPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Analysis & Insights</h1>
      <p className="text-gray-600 mb-8">
        Track your progress and gain insights from your conversations with Companira.
        This feature is coming soon.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-blue-600" />
              Mood Tracking
            </CardTitle>
            <CardDescription>
              Track your mood patterns over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-gray-50 rounded-b-lg">
            <p className="text-gray-500 text-center">
              Mood tracking visualization coming soon
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-green-600" />
              Progress Trends
            </CardTitle>
            <CardDescription>
              See your progress toward your goals
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-gray-50 rounded-b-lg">
            <p className="text-gray-500 text-center">
              Progress visualization coming soon
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-purple-600" />
              Topic Analysis
            </CardTitle>
            <CardDescription>
              Understand what topics you discuss most
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-gray-50 rounded-b-lg">
            <p className="text-gray-500 text-center">
              Topic analysis coming soon
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-red-600" />
              Weekly Summary
            </CardTitle>
            <CardDescription>
              Get a summary of your weekly activity
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-gray-50 rounded-b-lg">
            <p className="text-gray-500 text-center">
              Weekly summary generation coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisPage;
