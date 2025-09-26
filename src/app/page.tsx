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
  {
    name: 'Sarah Johnson',
    role: 'Healthcare Administrator',
    content: 'Essential for tracking our nursing shifts. The California overtime rules keep us compliant with healthcare regulations.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Tech Startup CEO',
    content: 'Clean, modern interface that developers actually want to use. Export features make client billing seamless.',
    rating: 5,
  },
  {
    name: 'Jennifer Williams',
    role: 'Retail Store Manager',
    content: 'Group management makes scheduling easy across multiple locations. Real-time tracking prevents time theft.',
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Mobile-first Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">TimeTracker</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center transition-colors shadow-sm"
              >
                Start Free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile-first Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 to-white overflow-hidden">
        <div className="max-w-4xl mx-auto py-16 px-6 sm:py-24 sm:px-8 lg:px-12">
          <div className="text-center">
            <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              <span className="block mb-2">Simple Time Tracking</span>
              <span className="block text-blue-600">for Small Teams</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 sm:text-xl">
              Clock in, clock out. That's it. Perfect for small businesses who need reliable time tracking without the complexity.
            </p>

            {/* Mobile-optimized CTA buttons */}
            <div className="mt-8 space-y-4 sm:space-y-0 sm:flex sm:flex-row sm:gap-4 sm:justify-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
              >
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-300 shadow-sm transition-all"
              >
                Only $1.99/month
              </Link>
            </div>

            {/* Mobile-optimized benefits */}
            <div className="mt-8 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:justify-center sm:gap-6 text-sm text-gray-600">
              <span className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                No setup fees
              </span>
              <span className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                No credit card required
              </span>
              <span className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-first Features Section */}
      <div className="py-16 bg-gray-50" id="features">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Everything you need
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple, reliable time tracking features
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {features.map((feature) => (
              <div key={feature.name} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                    <p className="mt-2 text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
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
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
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

            {/* Group Admin Plan */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-8 bg-green-600 text-center">
                <h3 className="text-2xl font-extrabold text-white">Group Admin</h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold text-white">$1.99</span>
                  <span className="ml-1 text-xl font-semibold text-green-100">/admin/month</span>
                </div>
                <p className="mt-4 text-green-100">Perfect for managers & supervisors</p>
              </div>
              <div className="px-6 pt-6 pb-8">
                <ul className="space-y-4">
                  {[
                    'Group management & oversight',
                    'Team member supervision',
                    'Group reports & analytics',
                    'Employee time review',
                    'No personal time tracking',
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
                    href="/signup?plan=group-admin"
                    className="w-full bg-green-600 text-white rounded-md px-4 py-3 text-center font-medium hover:bg-green-700 inline-block transition-colors"
                  >
                    Start 14-Day Free Trial
                  </Link>
                </div>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-lg shadow-lg overflow-visible border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-blue-500 text-white px-4 py-1 text-sm font-medium rounded-full shadow-lg whitespace-nowrap">
                  MOST POPULAR
                </span>
              </div>
              <div className="px-6 py-8 bg-gray-900 text-center pt-10">
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
                    'Priority support',
                    'Priority feature development'
                  ].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
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