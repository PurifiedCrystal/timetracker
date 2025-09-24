'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle,
  BarChart3,
  FileDown,
  Shield,
  Zap,
  ArrowRight,
  Star
} from 'lucide-react';

const features = [
  {
    icon: Clock,
    name: 'Simple Time Tracking',
    description: 'One-click clock in/out with cheat-proof server timestamps that employees can\'t manipulate.',
  },
  {
    icon: BarChart3,
    name: 'Basic Reports',
    description: 'View daily, weekly summaries and export to CSV for payroll processing.',
  },
  {
    icon: FileDown,
    name: 'CSV Export',
    description: 'Export time records to CSV format for easy integration with your accounting software.',
  },
  {
    icon: Shield,
    name: 'California Overtime Tracking',
    description: 'Automatic overtime calculations following California labor laws (more states coming soon).',
  },
  {
    icon: Zap,
    name: 'Live Session Tracking',
    description: 'See active time sessions with real-time duration updates.',
  },
  {
    icon: CheckCircle,
    name: 'Secure & Honest',
    description: 'Built with secure authentication and honest features - no false promises.',
  },
];

const testimonials = [
  {
    name: 'David Martinez',
    role: 'Construction Company Owner',
    content: 'TimeTracker has streamlined our payroll process. Labor compliance features save us from costly violations.',
    rating: 5,
  },
  {
    name: 'Lisa Thompson',
    role: 'Manufacturing Manager',
    content: 'Perfect for managing our 50+ workforce. The reporting features make payroll processing effortless.',
    rating: 5,
  },
  {
    name: 'Robert Kim',
    role: 'Restaurant Owner',
    content: 'Simple interface that our staff can use easily. Overtime tracking helps control labor costs.',
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">TimeTracker</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
              >
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Professional Time Tracking</span>{' '}
              <span className="block text-blue-600">for Business Owners</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-500">
              Streamline payroll, ensure labor compliance, and gain insights into your workforce productivity.
              Built for businesses who need accurate time tracking with enterprise-grade reliability.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-lg font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                View Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <span className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                No setup fees
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                No credit card required
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                14-day free trial
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Cancel anytime
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Volume discounts available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to track time
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Built with modern technologies and thoughtful design to make time tracking effortless.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <div key={feature.name} className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{feature.name}</h3>
                    <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Loved by thousands of users
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                <div className="font-medium text-gray-900">{testimonial.name}</div>
                <div className="text-sm text-gray-500">{testimonial.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gray-50 py-16" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Transparent pricing for every business size
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Scale with confidence. No hidden fees, no setup costs.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard Plan */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-8 bg-blue-600 text-center">
                <h3 className="text-2xl font-extrabold text-white">Standard</h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold text-white">$1.99</span>
                  <span className="ml-1 text-xl font-semibold text-blue-100">/user/month</span>
                </div>
                <p className="mt-4 text-blue-100">Perfect for small to medium businesses</p>
              </div>
              <div className="px-6 pt-6 pb-8">
                <ul className="space-y-4">
                  {[
                    'Unlimited time tracking per user',
                    '🛡️ Cheat-proof server timestamps',
                    'Basic reports & CSV export',
                    'California overtime tracking',
                    'Live session monitoring',
                    'Email support',
                    'Web-based access'
                  ].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href="/signup"
                    className="w-full bg-blue-600 text-white rounded-md px-4 py-3 text-center font-medium hover:bg-blue-700 inline-block transition-colors"
                  >
                    Start 14-Day Free Trial
                  </Link>
                </div>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-500 relative mt-8">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-2 text-sm font-medium rounded-full shadow-lg">
                  MOST POPULAR
                </span>
              </div>
              <div className="px-6 py-8 bg-gray-900 text-center pt-12">
                <h3 className="text-2xl font-extrabold text-white">Enterprise</h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-3xl font-extrabold text-white">Volume</span>
                  <span className="ml-2 text-xl font-semibold text-gray-300">Discount</span>
                </div>
                <p className="mt-4 text-gray-300">For teams of 20+ employees</p>
              </div>
              <div className="px-6 pt-6 pb-8">
                <ul className="space-y-4">
                  {[
                    'Everything in Standard plan',
                    'Custom pricing for 20+ users',
                    'Priority phone support',
                    'Custom feature development',
                    'Additional state labor laws',
                    'API integrations',
                    'Dedicated account manager'
                  ].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <a
                    href="mailto:sales@timetracker.com?subject=Enterprise%20Pricing%20Inquiry"
                    className="w-full bg-gray-900 text-white rounded-md px-4 py-3 text-center font-medium hover:bg-gray-800 inline-block transition-colors"
                  >
                    Contact Sales
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Volume Discount Info */}
          <div className="mt-12 text-center">
            <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Volume Discounts Available
              </h3>
              <p className="text-blue-700">
                Save more as your team grows. Contact our sales team for custom pricing on 20+ users.
                We work with businesses of all sizes to find the perfect solution.
              </p>
              <div className="mt-4">
                <a
                  href="mailto:sales@timetracker.com"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Get Custom Pricing
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold text-white">TimeTracker</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 TimeTracker. Simple, elegant time tracking.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}