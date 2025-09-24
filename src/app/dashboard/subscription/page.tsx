'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  AlertCircle,
  ExternalLink,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/v1/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load subscription');
      }
    } catch (err) {
      setError('Network error loading subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError('Network error creating checkout session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/subscription/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.portal_url) {
        // Redirect to Stripe customer portal
        window.location.href = data.portal_url;
      } else {
        setError(data.error || 'Failed to create portal session');
      }
    } catch (err) {
      setError('Network error creating portal session');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-800 bg-green-100';
      case 'past_due':
        return 'text-yellow-800 bg-yellow-100';
      case 'canceled':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasActiveSubscription = subscription && subscription.status === 'active';

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Subscription
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your TimeTracker subscription and billing
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Current Plan */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h3>

            {hasActiveSubscription ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">Pro Plan</div>
                    <div className="text-sm text-gray-500">$1.99/month</div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">Unlimited time tracking</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">Export reports (CSV, PDF, Excel)</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">California labor compliance</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">Real-time sync</span>
                  </div>
                </div>

                {subscription.current_period_end && (
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Renews on {formatDate(subscription.current_period_end)}</span>
                  </div>
                )}

                <button
                  onClick={handleManageSubscription}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Manage Subscription
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                  <p className="text-gray-500 mb-6">
                    Subscribe to TimeTracker Pro to unlock all features
                  </p>

                  <button
                    onClick={handleSubscribe}
                    disabled={actionLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Subscribe Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Plan Features */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">TimeTracker Pro</h3>

            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-extrabold text-gray-900">$1.99</span>
              <span className="ml-1 text-xl font-semibold text-gray-500">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">Unlimited Time Tracking</div>
                  <div className="text-sm text-gray-500">Clock in and out as many times as you need</div>
                </div>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">Advanced Reports</div>
                  <div className="text-sm text-gray-500">Daily, weekly, and monthly summaries</div>
                </div>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">Export Options</div>
                  <div className="text-sm text-gray-500">CSV, PDF, and Excel formats</div>
                </div>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">Labor Law Compliance</div>
                  <div className="text-sm text-gray-500">Automatic overtime tracking for California</div>
                </div>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">Email Support</div>
                  <div className="text-sm text-gray-500">Get help when you need it</div>
                </div>
              </li>
            </ul>

            {!hasActiveSubscription && (
              <div className="text-center">
                <button
                  onClick={handleSubscribe}
                  disabled={actionLoading}
                  className="w-full bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Start Free Trial
                </button>
                <p className="mt-2 text-xs text-gray-500">14-day free trial, no credit card required</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Billing FAQ */}
      <div className="mt-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Can I cancel anytime?</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">What payment methods do you accept?</h4>
                <p className="mt-1 text-sm text-gray-600">
                  We accept all major credit cards through Stripe, our secure payment processor.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">Is there a free trial?</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Yes! New users get a 14-day free trial with full access to all Pro features. No credit card required to start.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}