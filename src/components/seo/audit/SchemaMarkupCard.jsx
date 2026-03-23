import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Code,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';

const schemaTypes = {
  Organization: {
    icon: '🏢',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  LocalBusiness: {
    icon: '📍',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  Product: {
    icon: '🛍️',
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  },
  Article: {
    icon: '📄',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  FAQPage: {
    icon: '❓',
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  },
  BreadcrumbList: {
    icon: '🔗',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  WebSite: {
    icon: '🌐',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  Review: {
    icon: '⭐',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
};

export default function SchemaMarkupCard({ data }) {
  const [expandedSchema, setExpandedSchema] = useState(null);

  const schemaData = data || {
    totalSchemas: 5,
    validSchemas: 4,
    warningSchemas: 1,
    errorSchemas: 0,
    schemas: [
      {
        type: 'Organization',
        status: 'valid',
        url: '/',
        properties: ['name', 'url', 'logo', 'sameAs', 'contactPoint'],
        missingRecommended: ['foundingDate', 'numberOfEmployees'],
        errors: [],
        warnings: [],
      },
      {
        type: 'WebSite',
        status: 'valid',
        url: '/',
        properties: ['name', 'url', 'potentialAction'],
        missingRecommended: [],
        errors: [],
        warnings: [],
      },
      {
        type: 'Article',
        status: 'warning',
        url: '/blog/seo-guide',
        properties: ['headline', 'author', 'datePublished', 'image'],
        missingRecommended: ['dateModified'],
        errors: [],
        warnings: ['Missing recommended property: dateModified'],
      },
      {
        type: 'FAQPage',
        status: 'valid',
        url: '/faq',
        properties: ['mainEntity'],
        missingRecommended: [],
        errors: [],
        warnings: [],
      },
      {
        type: 'BreadcrumbList',
        status: 'valid',
        url: '/blog/seo-guide',
        properties: ['itemListElement'],
        missingRecommended: [],
        errors: [],
        warnings: [],
      },
    ],
    recommendations: [
      {
        type: 'Product',
        reason: 'Add Product schema to pricing page for rich results',
        priority: 'high',
      },
      {
        type: 'Review',
        reason: 'Add Review schema to testimonials for star ratings in SERPs',
        priority: 'medium',
      },
      {
        type: 'LocalBusiness',
        reason: 'Add LocalBusiness schema if you have physical locations',
        priority: 'low',
      },
    ],
  };

  const statusStyles = {
    valid: {
      icon: CheckCircle,
      color: 'text-emerald-500',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    error: {
      icon: XCircle,
      color: 'text-red-500',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Schema Markup Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {schemaData.totalSchemas}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Schemas</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {schemaData.validSchemas}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Valid</p>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {schemaData.warningSchemas}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Warnings</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {schemaData.errorSchemas}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Errors</p>
          </div>
        </div>

        {/* Schema List */}
        <div className="space-y-2">
          {schemaData.schemas.map((schema, idx) => {
            const typeConfig = schemaTypes[schema.type] || {
              icon: '📋',
              color: 'bg-gray-100 text-gray-700',
            };
            const StatusIcon = statusStyles[schema.status].icon;

            return (
              <div
                key={idx}
                className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedSchema(expandedSchema === idx ? null : idx)}
                  className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeConfig.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{schema.type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{schema.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusStyles[schema.status].badge}>
                      <StatusIcon className={`w-3 h-3 mr-1 ${statusStyles[schema.status].color}`} />
                      {schema.status}
                    </Badge>
                    {expandedSchema === idx ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {expandedSchema === idx && (
                  <div className="p-3 pt-0 space-y-3 border-t border-gray-100 dark:border-gray-700">
                    {/* Properties */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Properties Found
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {schema.properties.map((prop, pIdx) => (
                          <Badge
                            key={pIdx}
                            variant="outline"
                            className="text-xs dark:border-gray-600"
                          >
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />
                            {prop}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Missing Recommended */}
                    {schema.missingRecommended.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Missing Recommended
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {schema.missingRecommended.map((prop, pIdx) => (
                            <Badge
                              key={pIdx}
                              variant="outline"
                              className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {prop}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {schema.warnings.length > 0 && (
                      <div className="space-y-1">
                        {schema.warnings.map((warning, wIdx) => (
                          <div
                            key={wIdx}
                            className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400"
                          >
                            <AlertTriangle className="w-4 h-4 mt-0.5" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-3 h-3" />
                      Test in Google Rich Results
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Recommended Schemas to Add
          </p>
          <div className="space-y-2">
            {schemaData.recommendations.map((rec, idx) => {
              const typeConfig = schemaTypes[rec.type] || {
                icon: '📋',
                color: 'bg-gray-100 text-gray-700',
              };
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeConfig.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {rec.type}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{rec.reason}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : rec.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }
                  >
                    {rec.priority}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
