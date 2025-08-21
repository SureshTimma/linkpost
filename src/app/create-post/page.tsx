'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { useAuth } from '@/contexts/auth-context';
import { NewsItem } from '@/types';
import toast from 'react-hot-toast';

interface CreatePostForm {
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  publishOption: 'now' | 'schedule';
}

const CreatePostPage: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<'content' | 'schedule' | 'review'>('content');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [trendingNews, setTrendingNews] = useState<NewsItem[]>([]);
  const [generatedContent, setGeneratedContent] = useState('');

  // Get LinkedIn profile from user context (memoized to prevent re-renders)
  const linkedinProfile = useMemo(() => {
    return user?.connectedAccounts?.linkedin?.connected ? {
      name: user.connectedAccounts.linkedin.profile?.name || 
            `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
      picture: user.connectedAccounts.linkedin.profile?.picture || user.profile?.profilePicture || '',
      headline: user.connectedAccounts.linkedin.profile?.headline || 'Professional',
      email: user.connectedAccounts.linkedin.profile?.email || user.email
    } : {
      name: user?.profile?.firstName && user?.profile?.lastName 
        ? `${user.profile.firstName} ${user.profile.lastName}` 
        : 'Your Name',
      picture: user?.profile?.profilePicture || '',
      headline: 'Professional',
      email: user?.email || ''
    };
  }, [user]);

  const form = useForm<CreatePostForm>({
    defaultValues: {
      content: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
      publishOption: 'schedule'
    }
  });

  // Debug: Log LinkedIn data
  useEffect(() => {
    console.log('User LinkedIn data:', user?.connectedAccounts?.linkedin);
    console.log('Computed LinkedIn profile:', linkedinProfile);
  }, [user, linkedinProfile]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    // Mock trending news data
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'AI Revolution: New Breakthrough in Machine Learning',
        summary: 'Researchers achieve 95% accuracy in natural language understanding',
        content: 'A team of researchers has made significant breakthrough...',
        url: 'https://example.com/ai-breakthrough',
        imageUrl: '/api/placeholder/400/200',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        category: 'Technology',
        source: 'TechNews',
        trending: true
      },
      {
        id: '2',
        title: 'Remote Work Trends: The Future of Professional Collaboration',
        summary: 'Study shows 78% of companies plan to maintain hybrid work models',
        content: 'A comprehensive study involving 1000+ companies reveals...',
        url: 'https://example.com/remote-work-trends',
        imageUrl: '/api/placeholder/400/200',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        category: 'Business',
        source: 'BusinessInsider',
        trending: true
      },
      {
        id: '3',
        title: 'Sustainable Technology: Green Solutions for Digital Transformation',
        summary: 'Companies reduce carbon footprint by 40% through smart tech adoption',
        content: 'Leading corporations are implementing sustainable technology...',
        url: 'https://example.com/sustainable-tech',
        imageUrl: '/api/placeholder/400/200',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        category: 'Environment',
        source: 'GreenTech',
        trending: true
      }
    ];
    
    setTrendingNews(mockNews);
  }, []);

  const generateContent = async (newsItem?: NewsItem, customPrompt?: string) => {
    setIsGenerating(true);
    
    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let content = '';
      
      if (newsItem) {
        content = `🚀 Exciting developments in ${newsItem.category.toLowerCase()}!

${newsItem.summary}

This breakthrough highlights the rapid pace of innovation in our industry. As professionals, staying ahead of these trends is crucial for:

✅ Driving strategic decision-making
✅ Identifying new opportunities 
✅ Building competitive advantages

What are your thoughts on this development? How do you see it impacting your field?

#Innovation #Technology #ProfessionalDevelopment #LinkedInPost

---
Source: ${newsItem.source}`;
      } else if (customPrompt) {
        content = `💡 Here's my take on: "${customPrompt}"

[AI would generate relevant content based on the prompt]

This is an important topic that deserves our attention because it affects how we work, collaborate, and grow in our professional journeys.

Key takeaways:
• [Generated insight 1]
• [Generated insight 2] 
• [Generated insight 3]

What's your experience with this? I'd love to hear your perspective in the comments!

#LinkedInPost #ProfessionalInsights #ThoughtLeadership`;
      } else {
        content = `🎯 Sharing some professional insights!

In today's fast-paced world, continuous learning and adaptation are key to success. Here are some thoughts on staying ahead:

🔹 Embrace new technologies and tools
🔹 Build meaningful professional relationships
🔹 Share knowledge and learn from others
🔹 Stay curious and keep questioning

What strategies have worked best for you in your professional journey?

#ProfessionalGrowth #CareerDevelopment #LinkedInNetworking`;
      }
      
      setGeneratedContent(content);
      form.setValue('content', content);
      toast.success('Content generated successfully!');
      
    } catch (error) {
      console.error('Content generation failed:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewsSelect = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    generateContent(newsItem);
  };

  const handleCustomGenerate = () => {
    const userPrompt = window.prompt('Enter a topic or prompt for content generation:');
    if (userPrompt) {
      generateContent(undefined, userPrompt);
    }
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    console.log('handleNextStep called, current step:', step);
    if (e) {
      e.preventDefault(); // Prevent any form submission
    }
    if (step === 'content') {
      setStep('schedule');
    } else if (step === 'schedule') {
      setStep('review');
    }
  };

  const handleSubmit = async (data: CreatePostForm) => {
    console.log('handleSubmit called with data:', data);
    console.log('Current step:', step);
    
    // Only allow submission when on the review step
    if (step !== 'review') {
      console.log('Form submitted but not on review step, ignoring...');
      return;
    }
    
    if (!user) return;

    try {
      // Check if user has posts remaining
      const postsRemaining = user.subscription.postsLimit - user.subscription.postsUsed;
      if (postsRemaining <= 0) {
        toast.error('You have no posts remaining. Please upgrade to premium.');
        router.push('/pricing');
        return;
      }

      console.log('Making API call to /api/posts/publish');

      const requestBody = {
        content: data.content,
        publishNow: data.publishOption === 'now',
        scheduleDate: data.publishOption === 'schedule' 
          ? `${data.scheduledDate}T${data.scheduledTime}:00` 
          : undefined
      };

      const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          data.publishOption === 'now' 
            ? 'Post published to LinkedIn successfully!' 
            : 'Post scheduled successfully!'
        );
        router.push('/dashboard');
      } else {
        throw new Error(result.error || 'Failed to publish post');
      }
      
    } catch (error) {
      console.error('Post creation failed:', error);
      toast.error('Failed to create post. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icons.Spinner size={32} className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center">
              <div className="h-8 w-8 bg-blue-700 rounded-lg flex items-center justify-center">
                <Icons.LinkedIn size={20} color="white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">LinkPost</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.subscription.postsLimit - user.subscription.postsUsed} posts remaining
              </span>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {['content', 'schedule', 'review'].map((stepName, index) => (
              <React.Fragment key={stepName}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === stepName ? 'bg-blue-700 text-white' : 
                  ['content', 'schedule', 'review'].indexOf(step) > index ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-600'
                }`}>
                  {['content', 'schedule', 'review'].indexOf(step) > index ? (
                    <Icons.Check size={16} />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div className={`w-16 h-1 mx-2 ${
                    ['content', 'schedule', 'review'].indexOf(step) > index ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-20 text-sm text-gray-600">
              <span>Content</span>
              <span>Schedule</span>
              <span>Review</span>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} onKeyDown={(e) => {
          // Prevent Enter key from submitting the form unless on review step
          if (e.key === 'Enter' && step !== 'review') {
            e.preventDefault();
          }
        }}>
          {/* Content Step */}
          {step === 'content' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Your LinkedIn Post</CardTitle>
                  <CardDescription>
                    Generate content from trending news or write your own
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Content Generation Options */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Content Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          type="button"
                          variant="outline" 
                          className="h-auto p-4 text-left"
                          onClick={handleCustomGenerate}
                          disabled={isGenerating}
                        >
                          <div>
                            <Icons.Edit size={20} className="mb-2" />
                            <h4 className="font-medium">Custom Content</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Generate content from your own topic or prompt
                            </p>
                          </div>
                        </Button>
                        
                        <Button 
                          type="button"
                          variant="outline" 
                          className="h-auto p-4 text-left"
                          disabled
                        >
                          <div>
                            <Icons.Newspaper size={20} className="mb-2" />
                            <h4 className="font-medium">From Trending News</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Select from current trending topics below
                            </p>
                          </div>
                        </Button>
                      </div>
                    </div>

                    {/* Trending News */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Trending Topics</h3>
                      <div className="space-y-4">
                        {trendingNews.map((news) => (
                          <Card 
                            key={news.id} 
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedNews?.id === news.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => handleNewsSelect(news)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Icons.Newspaper size={24} color="#6B7280" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">{news.title}</h4>
                                  <p className="text-sm text-gray-600 mb-2">{news.summary}</p>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <span>{news.source}</span>
                                    <span className="mx-2">•</span>
                                    <span>{news.category}</span>
                                    <span className="mx-2">•</span>
                                    <span>{new Date(news.publishedAt).toLocaleTimeString()}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Content Editor */}
                    <div>
                      <Textarea
                        label="Post Content"
                        placeholder="Write your LinkedIn post here..."
                        rows={12}
                        {...form.register('content', { required: 'Post content is required' })}
                        error={form.formState.errors.content?.message}
                      />
                      <div className="mt-2 text-sm text-gray-500">
                        {form.watch('content')?.length || 0} characters
                      </div>
                    </div>

                    {isGenerating && (
                      <div className="flex items-center justify-center py-8">
                        <Icons.Spinner size={24} className="mr-2" />
                        <span>Generating content...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Schedule Step */}
          {step === 'schedule' && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Your Post</CardTitle>
                <CardDescription>
                  Choose when to publish your LinkedIn post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Publish Option Selection */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">When would you like to publish?</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="now"
                          {...form.register('publishOption')}
                          className="text-blue-600"
                        />
                        <span>Publish Now</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="schedule"
                          {...form.register('publishOption')}
                          className="text-blue-600"
                        />
                        <span>Schedule for Later</span>
                      </label>
                    </div>
                  </div>

                  {/* Schedule Options - Only show when schedule is selected */}
                  {form.watch('publishOption') === 'schedule' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        type="date"
                        label="Publication Date"
                        {...form.register('scheduledDate', { required: 'Date is required' })}
                        error={form.formState.errors.scheduledDate?.message}
                      />
                      
                      <Input
                        type="time"
                        label="Publication Time"
                        {...form.register('scheduledTime', { required: 'Time is required' })}
                        error={form.formState.errors.scheduledTime?.message}
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <Icons.Info size={20} color="#3B82F6" className="mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Optimal Posting Times</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Best engagement typically occurs between 8-10 AM and 12-2 PM on weekdays.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Publish</CardTitle>
                <CardDescription>
                  Review your post before scheduling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Post Preview */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start space-x-3 mb-3">
                      {linkedinProfile.picture ? (
                        <Image 
                          src={linkedinProfile.picture} 
                          alt="LinkedIn Profile"
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
                          <Icons.User size={20} color="white" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {linkedinProfile.name || `${user.profile.firstName} ${user.profile.lastName}`}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {linkedinProfile.headline || 'Professional'}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Icons.LinkedIn size={16} className="text-blue-700" />
                      </div>
                    </div>
                    
                    <div className="whitespace-pre-wrap text-gray-900 mb-4">
                      {form.watch('content')}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>👍 Like</span>
                      <span>💬 Comment</span>
                      <span>🔄 Repost</span>
                      <span>📤 Send</span>
                    </div>
                  </div>

                  {/* Schedule Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Publishing Details</h4>
                    <div className="text-sm text-gray-600">
                      {form.watch('publishOption') === 'now' ? (
                        <p>✅ This post will be published immediately to LinkedIn</p>
                      ) : (
                        <>
                          <p>📅 Date: {new Date(form.watch('scheduledDate')).toLocaleDateString()}</p>
                          <p>🕐 Time: {form.watch('scheduledTime')}</p>
                          <p>🌍 Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {step !== 'content' && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    if (step === 'schedule') setStep('content');
                    else if (step === 'review') setStep('schedule');
                  }}
                >
                  Previous
                </Button>
              )}
            </div>
            
            <div>
              {step === 'review' ? (
                <Button type="submit" loading={isLoading}>
                  <Icons.Send size={16} className="mr-2" />
                  {form.watch('publishOption') === 'now' ? 'Publish Now' : 'Schedule Post'}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleNextStep}
                  disabled={!form.watch('content')}
                >
                  Next
                  <Icons.ChevronRight size={16} className="ml-2" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;
