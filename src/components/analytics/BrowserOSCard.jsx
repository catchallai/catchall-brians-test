import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chrome, Apple, Monitor } from 'lucide-react';

export default function BrowserOSCard({ data }) {
  // SyberJet browser/OS data - premium audience with higher macOS/Safari usage
  const browsers = data?.browsers || [
    { name: 'Chrome', percentage: 46, color: '#4285F4' },
    { name: 'Safari', percentage: 38, color: '#0FB5EE' },
    { name: 'Firefox', percentage: 8, color: '#FF7139' },
    { name: 'Edge', percentage: 5, color: '#0078D7' },
    { name: 'Other', percentage: 3, color: '#9CA3AF' },
  ];

  const os = data?.os || [
    { name: 'macOS', percentage: 44, color: '#A3AAAE' },
    { name: 'Windows', percentage: 32, color: '#00BCF2' },
    { name: 'iOS', percentage: 16, color: '#007AFF' },
    { name: 'Android', percentage: 5, color: '#3DDC84' },
    { name: 'Linux', percentage: 3, color: '#FCC624' },
  ];

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-500" />
          Browser & OS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Browsers */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
              <Chrome className="w-3 h-3" /> Browsers
            </p>
            <div className="space-y-2">
              {browsers.map((browser) => (
                <div key={browser.name} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: browser.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                    {browser.name}
                  </span>
                  <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${browser.percentage}%`, backgroundColor: browser.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-8 text-right">
                    {browser.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Operating Systems */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
              <Apple className="w-3 h-3" /> Operating Systems
            </p>
            <div className="space-y-2">
              {os.map((system) => (
                <div key={system.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: system.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                    {system.name}
                  </span>
                  <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${system.percentage}%`, backgroundColor: system.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-8 text-right">
                    {system.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
