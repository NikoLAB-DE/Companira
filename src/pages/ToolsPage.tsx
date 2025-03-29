import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Mic, BookOpen, Calendar, PenTool } from 'lucide-react';

const ToolsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Tools & Exercises</h1>
      <p className="text-gray-600 mb-8">
        Explore additional tools and exercises to support your mental wellbeing.
        These features are coming soon.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PenTool className="h-5 w-5 mr-2 text-blue-600" />
              Guided Journaling
            </CardTitle>
            <CardDescription>
              Structured prompts to help you reflect
            </CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center bg-gray-50 rounded-b-lg">
            <p className="text-gray-500 text-center">
              Journaling prompts coming soon
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2 text-green-600" />
              Voice Conversations
            </CardTitle>
            <CardDescription>
              Speak with your assistant using voice
            </CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center bg-gray-50 rounded-b-lg">
            <p className="text-gray-500 text-center">
              Voice input/output coming soon
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Daily Check-ins
            </CardTitle>
            <CardDescription>
              Quick daily mood and progress tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center bg-gray-50 rounded-b-lg">
            <p className="text-gray-500 text-center">
              Daily check-in system coming soon
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-red-600" />
              Resource Library
            </CardTitle>
            <CardDescription>
              Curated resources for mental wellbeing
            </CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center bg-gray-50 rounded-b-lg">
            <p className="text-gray-500 text-center">
              Resource library coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ToolsPage;
