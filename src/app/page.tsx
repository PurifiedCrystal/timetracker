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
    description: 'One-click clock in and out with elegant, distraction-free interface.',
  },
  {
    icon: BarChart3,
    name: 'Smart Analytics',
    description: 'View daily, weekly, and monthly summaries with overtime calculations.',
  },
  {
    icon: FileDown,
    name: 'Export Reports',
    description: 'Generate CSV, PDF, and Excel reports for payroll and record-keeping.',
  },
  {
    icon: Shield,
    name: 'California Labor Compliance',
    description: 'Automatic overtime tracking and break reminders for CA users.',
  },
  {
    icon: Zap,
    name: 'Real-time Updates',
    description: 'Live session tracking with automatic duration calculations.',
  },
  {
    icon: CheckCircle,
    name: 'Reliable & Secure',
    description: 'Built with enterprise-grade security and 99.9% uptime.',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Freelance Designer',
    content: 'TimeTracker has simplified my billing process. The export feature saves me hours every month.',
    rating: 5,
  },
  {
    name: 'Mike Rodriguez',
    role: 'Small Business Owner',
    content: 'Perfect for managing my team\'s hours. The California labor compliance feature is a lifesaver.',
    rating: 5,
  },
  {
    name: 'Emily Johnson',
    role: 'Consultant',
    content: 'Clean, simple interface that just works. No bloat, just what I need to track time effectively.',
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
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Simple, elegant</span>{' '}
                  <span className="block text-blue-600 xl:inline">time tracking</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Track your work hours with a clean, distraction-free interface.
                  Built for freelancers, consultants, and small teams who value simplicity and reliability.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/signup"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                    >
                      Start Free Trial
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
                <div className="mt-6 text-sm text-gray-500">
                  <span className="font-medium text-green-600">✓</span> No credit card required
                  <span className="ml-4 font-medium text-green-600">✓</span> Cancel anytime
                  <span className="ml-4 font-medium text-green-600">✓</span> $1.99/month
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-br from-blue-50 to-blue-100 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-center">
              <Clock className="h-32 w-32 text-blue-200 mx-auto mb-4" />
              <div className="text-6xl font-mono font-bold text-blue-400">08:42:15</div>
              <div className="text-blue-600 font-medium mt-2">Active Session</div>
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
      <div className="bg-white py-16" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              No hidden fees, no complicated tiers. Just honest pricing for honest work.
            </p>
          </div>
          <div className="mt-10 flex justify-center">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md">
              <div className="px-6 py-8 bg-blue-600 text-center">
                <h3 className="text-2xl font-extrabold text-white">Pro</h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold text-white">$1.99</span>
                  <span className="ml-1 text-xl font-semibold text-blue-100">/month</span>
                </div>
                <p className="mt-4 text-blue-100">Everything you need to track time effectively</p>
              </div>
              <div className="px-6 pt-6 pb-8">
                <ul className="space-y-4">
                  {[
                    'Unlimited time tracking',
                    'Daily, weekly, monthly reports',
                    'CSV, PDF, Excel exports',
                    'California labor compliance',
                    'Real-time sync',
                    'Email support'
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
                    className="w-full bg-blue-600 text-white rounded-md px-4 py-2 text-center font-medium hover:bg-blue-700 inline-block"
                  >
                    Start Free Trial
                  </Link>
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