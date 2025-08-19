'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { useAuth } from '@/contexts/auth-context';

const PricingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const plans = [
    {
      name: 'Free Trial',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for trying out LinkPost',
      features: [
        '1 automated LinkedIn post',
        'Basic scheduling options',
        'News-based content suggestions',
        'Phone OTP authentication',
        'Basic dashboard access',
        'Community support'
      ],
      limitations: [
        'Limited to 1 post only',
        'No media quality control',
        'No advanced analytics',
        'No priority support'
      ],
      popular: false,
      cta: 'Start Free Trial',
      href: isAuthenticated ? '/dashboard' : '/auth'
    },
    {
      name: 'Premium Plan',
      price: '₹100',
      period: '3 months',
      description: 'Unlock unlimited potential for your LinkedIn presence',
      features: [
        'Unlimited automated posts',
        'Advanced scheduling system',
        'Individual user schedules',
        'Priority news feeds & trending topics',
        'Media quality control & optimization',
        'Complete analytics dashboard',
        'LinkedIn & Google OAuth integration',
        'Priority customer support',
        'Render cost management',
        'Advanced post customization',
        'Bulk scheduling capabilities',
        'Performance insights & recommendations'
      ],
      limitations: [],
      popular: true,
      cta: 'Upgrade to Premium',
      href: isAuthenticated ? '/dashboard' : '/auth'
    }
  ];

  const features = [
    {
      icon: Icons.Shield,
      title: 'Secure Authentication',
      description: 'Phone OTP verification ensures your account is always protected'
    },
    {
      icon: Icons.LinkedIn,
      title: 'LinkedIn Integration',
      description: 'Native OAuth integration with LinkedIn for seamless posting'
    },
    {
      icon: Icons.Newspaper,
      title: 'AI Content Generation',
      description: 'Generate engaging posts from trending news and topics'
    },
    {
      icon: Icons.Calendar,
      title: 'Smart Scheduling',
      description: 'Flexible scheduling system with timezone support'
    },
    {
      icon: Icons.BarChart,
      title: 'Analytics Dashboard',
      description: 'Track performance and optimize your LinkedIn strategy'
    },
    {
      icon: Icons.Settings,
      title: 'Quality Control',
      description: 'Automated media quality checks and content optimization'
    }
  ];

  const faqs = [
    {
      question: 'How does the free trial work?',
      answer: 'You get 1 free automated LinkedIn post to try out our service. No credit card required, no hidden fees.'
    },
    {
      question: 'What happens after 3 months of Premium?',
      answer: 'Your subscription will need to be renewed. We will notify you before expiration, and you can choose to renew or continue with the free plan.'
    },
    {
      question: 'Can I change my plan anytime?',
      answer: 'Yes! You can upgrade from free to premium anytime. Downgrades take effect at the end of your current billing period.'
    },
    {
      question: 'Is my LinkedIn account safe?',
      answer: 'Absolutely. We use OAuth authentication, which means we never store your LinkedIn password. You can revoke access anytime.'
    },
    {
      question: 'What kind of content can I post?',
      answer: 'You can post text updates with images, generated content from news articles, and custom posts. We support most LinkedIn post formats.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 7-day money-back guarantee if you are not satisfied with the Premium plan.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-blue-700 rounded-lg flex items-center justify-center">
                <Icons.LinkedIn size={20} color="white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">LinkPost</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your LinkedIn automation needs. 
            Start free, upgrade when you&apos;re ready for unlimited posts.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-xl' : 'shadow-lg'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-medium">
                    ⭐ Most Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-1">/{plan.period}</span>
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  {/* Features */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">What&apos;s included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Icons.Check size={16} color="#10B981" className="mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Limitations:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitationIndex) => (
                          <li key={limitationIndex} className="flex items-start">
                            <Icons.AlertCircle size={16} color="#F59E0B" className="mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link href={plan.href} className="block">
                    <Button 
                      className="w-full mt-6" 
                      variant={plan.popular ? 'primary' : 'outline'}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose LinkPost?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for successful LinkedIn automation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon size={24} color="#1E40AF" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Got questions? We&apos;ve got answers.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-blue-700 rounded-2xl py-16 px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Automate Your LinkedIn Success?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who are growing their LinkedIn presence with LinkPost. 
            Start your free trial today!
          </p>
          <Link href={isAuthenticated ? '/dashboard' : '/auth'}>
            <Button size="lg" variant="secondary">
              <Icons.LinkedIn size={20} className="mr-2" />
              {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default PricingPage;
