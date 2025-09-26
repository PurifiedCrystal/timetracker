'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { SubscriptionStatus as Status } from '@/types/subscription';

interface Subscription {
  id: string;
  status: Status;
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id?: string;
}

interface SubscriptionStatusProps {
  subscription?: Subscription | null;
  onUpgrade?: () => void;
  onManage?: () => void;
  loading?: boolean;
  className?: string;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscription,
  onUpgrade,
  onManage,
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-6 animate-pulse', className)}>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusConfig = (status?: Status) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          color: 'green',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'past_due':
        return {
          label: 'Past Due',
          color: 'red',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        };
      case 'canceled':
        return {
          label: 'Canceled',
          color: 'gray',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      default:
        return {
          label: 'No Subscription',
          color: 'gray',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const statusConfig = getStatusConfig(subscription?.status);
  const hasActiveSubscription = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';

  return (
    <div className={cn(
      'bg-white rounded-lg border p-6',
      statusConfig.borderColor,
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={cn(
            'flex-shrink-0 p-2 rounded-lg',
            statusConfig.bgColor,
            statusConfig.textColor
          )}>
            {statusConfig.icon}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Subscription Status
            </h3>
            <div className="mt-1 flex items-center space-x-2">
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                statusConfig.bgColor,
                statusConfig.textColor
              )}>
                {statusConfig.label}
              </span>
              {hasActiveSubscription && (
                <span className="text-sm text-gray-600">
                  $1.99/month
                </span>
              )}
            </div>

            {subscription && (
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {hasActiveSubscription && (
                  <>
                    <div>
                      <span className="font-medium">Billing Period:</span>{' '}
                      {formatDate(subscription.current_period_start)} -{' '}
                      {formatDate(subscription.current_period_end)}
                    </div>
                    <div>
                      <span className="font-medium">Next Billing:</span>{' '}
                      {formatDate(subscription.current_period_end)}
                    </div>
                  </>
                )}

                {isPastDue && (
                  <div className="text-red-600">
                    <span className="font-medium">Action Required:</span>{' '}
                    Please update your payment method to continue using TimeTracker.
                  </div>
                )}

                {subscription.status === 'canceled' && (
                  <div>
                    <span className="font-medium">Access Until:</span>{' '}
                    {formatDate(subscription.current_period_end)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          {!subscription || subscription.status === 'canceled' ? (
            <Button onClick={onUpgrade} disabled={loading}>
              Subscribe Now
            </Button>
          ) : (
            <div className="space-y-2">
              {onManage && (
                <Button
                  variant="outline"
                  onClick={onManage}
                  disabled={loading}
                  className="w-full"
                >
                  Manage Subscription
                </Button>
              )}
              {isPastDue && onUpgrade && (
                <Button
                  onClick={onUpgrade}
                  disabled={loading}
                  className="w-full"
                >
                  Update Payment
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature Access Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Feature Access
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureItem
            name="Time Tracking"
            available={true}
            description="Basic clock in/out functionality"
          />
          <FeatureItem
            name="California Labor Rules"
            available={hasActiveSubscription}
            description="Overtime calculations & compliance"
          />
          <FeatureItem
            name="Export & Reports"
            available={hasActiveSubscription}
            description="CSV, PDF, Excel exports"
          />
          <FeatureItem
            name="Team Management"
            available={hasActiveSubscription}
            description="Groups, invitations, manager view"
          />
        </div>
      </div>

      {/* Trial Info */}
      {!subscription && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                14-Day Free Trial Available
              </h4>
              <div className="mt-1 text-sm text-blue-700">
                Start your free trial to access all premium features including exports,
                California labor law compliance, and team management tools.
              </div>
              <div className="mt-3">
                <Link href="/pricing">
                  <Button size="sm" variant="primary">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FeatureItemProps {
  name: string;
  available: boolean;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({
  name,
  available,
  description
}) => {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-0.5">
        {available ? (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div>
        <div className={cn(
          'text-sm font-medium',
          available ? 'text-gray-900' : 'text-gray-500'
        )}>
          {name}
        </div>
        <div className="text-xs text-gray-500">
          {description}
        </div>
      </div>
    </div>
  );
};