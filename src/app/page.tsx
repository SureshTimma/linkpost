'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';

export default function HomePage() {
  const features = [
    {
      icon: Icons.Phone,
      title: 'Phone OTP Authentication',
      description: 'Secure login via phone number and OTP verification'
    },
    {
      icon: Icons.LinkedIn,
      title: 'OAuth Account Linking',
      description: 'Connect both LinkedIn and Google for seamless integrations'
    },
    {
      icon: Icons.Crown,
      title: 'Free Trial Post',
      description: 'One free automated LinkedIn post per user to get started'
    },
    {
      icon: Icons.Calendar,
      title: 'Flexible Scheduling',
      description: 'Choose your own days and times for automated posts'
    },
    {
      icon: Icons.Edit,
      title: 'Post Draft & Review',
      description: 'Generate post drafts from trending news; preview before publishing'
    },
    {
      icon: Icons.Newspaper,
      title: 'News-Based Suggestions',
      description: 'Get content ideas based on current events and trending topics'
    }
  ];

  const pricingPlans = [
    {
      name: 'Free Trial',
      price: '₹0',
      period: 'forever',
      features: [
        '1 automated post',
        'Basic scheduling',
        'News suggestions',
        'Phone authentication'
      ],
      popular: false
    },
    {
      name: 'Premium Plan',
      price: '₹100',
      period: '3 months',
      features: [
        'Unlimited posts',
        'Advanced scheduling',
        'Priority news feeds',
        'Media quality control',
        'Analytics dashboard',
        'Priority support'
      ],
      popular: true
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
  <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-[var(--color-border)]">
        <div className="container-padded">
          <div className="flex justify-between items-center h-16 gap-6">
            <div className="flex items-center">
              <div className="h-9 w-9 bg-[var(--color-primary)] rounded-md flex items-center justify-center shadow-sm">
                <Icons.LinkedIn size={18} color="white" />
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900 tracking-tight">LinkPost</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-3">
              <Link href="/auth">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/pricing">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white to-[var(--color-primary-bg)]/60" />
        <div className="container-padded max-w-5xl text-center">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight text-gray-900 mb-8">
            Your Friendly <span className="text-gradient">LinkedIn</span> Auto‑Posting Companion
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Automate your LinkedIn presence with AI-powered content generation, smart scheduling, and seamless integrations.
            <span className="hidden sm:inline"> Start with a free post today!</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="w-full sm:w-auto shadow">
                <Icons.LinkedIn size={18} className="-ml-1 mr-2 icon" />Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">Learn More</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
  <section id="features" className="py-24 bg-white">
        <div className="container-padded">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">Everything You Need for LinkedIn Automation</h2>
            <p className="text-gray-600 text-lg">From secure authentication to AI-powered content generation, we have the tools you need to grow your LinkedIn presence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="flex flex-col card-hover">
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center mb-5 bg-[var(--color-primary-bg)] text-[var(--color-primary)]">
                    <feature.icon size={22} className="icon" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2 flex-0">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="container-padded max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600">Start free, upgrade when you&apos;re ready for unlimited posts.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'ring-2 ring-[var(--color-primary)] shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[var(--color-primary)] text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-semibold tracking-tight">{plan.name}</CardTitle>
                  <div className="mt-3 flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900 leading-none">{plan.price}</span>
                    <span className="text-sm text-gray-500 mb-1">/{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
      <ul className="space-y-3 mb-6 text-sm">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Icons.Check size={16} className="mr-3 text-[var(--color-primary)]" />
        <span className="text-gray-600 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/auth">
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'primary' : 'outline'}
                    >
                      {plan.name === 'Free Trial' ? 'Start Free' : 'Upgrade Now'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-[var(--color-primary)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="container-padded max-w-4xl text-center relative">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-5">Ready to Automate Your LinkedIn Presence?</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Join professionals who trust LinkPost to grow their LinkedIn reach.</p>
          <Link href="/auth"><Button size="lg" variant="secondary" className="font-semibold">Get Started Free</Button></Link>
        </div>
      </section>

      {/* Footer */}
  <footer className="mt-auto bg-gray-950 py-12 text-sm text-gray-400">
        <div className="container-padded flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <div className="h-9 w-9 bg-[var(--color-primary)] rounded-md flex items-center justify-center">
              <Icons.LinkedIn size={18} color="white" />
            </div>
            <span className="ml-2 text-lg font-semibold text-white tracking-tight">LinkPost</span>
          </div>
          <div>© 2025 LinkPost. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
