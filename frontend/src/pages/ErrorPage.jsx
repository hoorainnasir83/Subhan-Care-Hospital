import React from 'react';
import { AlertTriangle, ShieldOff, Lock, Search, Ban, Clock, Zap, ServerCrash, Wifi, WifiOff, ArrowLeft, Home, RotateCcw } from 'lucide-react';

const ERROR_CONFIG = {
  400: {
    icon: AlertTriangle,
    color: 'amber',
    title: 'Bad Request',
    description: 'The server could not understand your request. Please check the data you submitted and try again.',
    showRetry: true,
  },
  401: {
    icon: Lock,
    color: 'rose',
    title: 'Unauthorized',
    description: 'Your session has expired or you are not logged in. Please sign in to continue.',
    showRetry: false,
  },
  403: {
    icon: ShieldOff,
    color: 'red',
    title: 'Access Forbidden',
    description: 'You do not have permission to access this resource. Contact your administrator if you believe this is a mistake.',
    showRetry: false,
  },
  404: {
    icon: Search,
    color: 'blue',
    title: 'Page Not Found',
    description: 'The page you are looking for doesn\'t exist or has been moved to a different location.',
    showRetry: false,
  },
  405: {
    icon: Ban,
    color: 'orange',
    title: 'Method Not Allowed',
    description: 'The request method is not supported for this resource. Please try a different approach.',
    showRetry: false,
  },
  408: {
    icon: Clock,
    color: 'yellow',
    title: 'Request Timeout',
    description: 'The server took too long to respond. This might be due to a slow network connection.',
    showRetry: true,
  },
  429: {
    icon: Zap,
    color: 'purple',
    title: 'Too Many Requests',
    description: 'You\'ve made too many requests in a short period. Please wait a moment and try again.',
    showRetry: true,
  },
  500: {
    icon: ServerCrash,
    color: 'red',
    title: 'Internal Server Error',
    description: 'Something went wrong on our end. Our team has been notified and is working to fix the issue.',
    showRetry: true,
  },
  502: {
    icon: Wifi,
    color: 'slate',
    title: 'Bad Gateway',
    description: 'The server received an invalid response from an upstream server. Please try again shortly.',
    showRetry: true,
  },
  503: {
    icon: WifiOff,
    color: 'gray',
    title: 'Service Unavailable',
    description: 'The system is currently undergoing maintenance. Please check back in a few minutes.',
    showRetry: true,
  },
};

const COLOR_MAP = {
  amber:  { bg: 'bg-amber-50 dark:bg-amber-950/30', iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-800' },
  rose:   { bg: 'bg-rose-50 dark:bg-rose-950/30', iconBg: 'bg-rose-100 dark:bg-rose-900/40', iconColor: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-200 dark:ring-rose-800' },
  red:    { bg: 'bg-red-50 dark:bg-red-950/30', iconBg: 'bg-red-100 dark:bg-red-900/40', iconColor: 'text-red-600 dark:text-red-400', ring: 'ring-red-200 dark:ring-red-800' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-800' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/30', iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40', iconColor: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-200 dark:ring-yellow-800' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/30', iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-200 dark:ring-purple-800' },
  slate:  { bg: 'bg-slate-50 dark:bg-slate-950/30', iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400', ring: 'ring-slate-200 dark:ring-slate-700' },
  gray:   { bg: 'bg-gray-50 dark:bg-gray-950/30', iconBg: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-600 dark:text-gray-400', ring: 'ring-gray-200 dark:ring-gray-700' },
};

/**
 * A universal, reusable Error Page component.
 *
 * @param {number}    code        - HTTP error code (400, 401, 403, 404, etc.)
 * @param {string}    [message]   - Optional override for the description
 * @param {function}  [onGoHome]  - Callback to navigate to the dashboard/home
 * @param {function}  [onRetry]   - Callback to retry the action
 * @param {boolean}   [fullScreen] - If true, renders as a full-screen page (default: false)
 */
const ErrorPage = ({ code = 404, message, onGoHome, onRetry, fullScreen = false }) => {
  const config = ERROR_CONFIG[code] || ERROR_CONFIG[500];
  const colors = COLOR_MAP[config.color] || COLOR_MAP.red;
  const Icon = config.icon;

  const content = (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-16 ${fullScreen ? 'min-h-screen bg-slate-50 dark:bg-slate-950' : ''}`}>
      {/* Error Code Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${colors.bg} ring-1 ${colors.ring} mb-8`}>
        <span className={`text-xs font-bold uppercase tracking-wider ${colors.iconColor}`}>Error {code}</span>
      </div>

      {/* Icon */}
      <div className={`h-20 w-20 rounded-2xl ${colors.iconBg} flex items-center justify-center mb-6 shadow-lg`}>
        <Icon className={`h-10 w-10 ${colors.iconColor}`} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-extrabold font-outfit text-slate-800 dark:text-slate-100 mb-3">
        {config.title}
      </h1>

      {/* Description */}
      <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mb-10 leading-relaxed">
        {message || config.description}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Go Back */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>

        {/* Go to Dashboard */}
        <button
          onClick={onGoHome || (() => { window.location.href = '/'; })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-brand-500/20"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </button>

        {/* Retry */}
        {config.showRetry && (
          <button
            onClick={onRetry || (() => window.location.reload())}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>

      {/* Help Line */}
      <p className="mt-12 text-xs text-slate-400 dark:text-slate-500">
        Need assistance? Contact support at{' '}
        <a href="tel:051-8464646" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">051-8464646</a>
      </p>
      <p className="mt-2 text-[11px] text-slate-300 dark:text-slate-600">
        © {new Date().getFullYear()} Subhan Care Hospitals Ltd.
      </p>
    </div>
  );

  return content;
};

export default ErrorPage;
