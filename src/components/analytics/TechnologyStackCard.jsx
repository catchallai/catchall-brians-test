import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Wifi, MonitorSmartphone, Languages } from 'lucide-react';

export default function TechnologyStackCard() {
  // SyberJet visitor technology data
  const screenResolutions = [
    { resolution: '1920x1080', percentage: 32 },
    { resolution: '2560x1440', percentage: 24 },
    { resolution: '1440x900', percentage: 15 },
    { resolution: '1366x768', percentage: 12 },
    { resolution: '375x812 (Mobile)', percentage: 10 },
    { resolution: 'Other', percentage: 7 },
  ];

  const connectionTypes = [
    { type: 'Fiber/Cable', percentage: 68, speed: '100+ Mbps' },
    { type: '4G/LTE', percentage: 22, speed: '15-50 Mbps' },
    { type: '5G', percentage: 8, speed: '100+ Mbps' },
    { type: 'Other', percentage: 2, speed: 'Varies' },
  ];

  const languages = [
    { language: 'English (US)', percentage: 48, code: 'en-US' },
    { language: 'English (UK)', percentage: 12, code: 'en-GB' },
    { language: 'Arabic', percentage: 11, code: 'ar' },
    { language: 'German', percentage: 8, code: 'de' },
    { language: 'French', percentage: 7, code: 'fr' },
    { language: 'Chinese', percentage: 5, code: 'zh' },
    { language: 'Other', percentage: 9, code: '-' },
  ];

  const adBlockUsage = 28; // percentage using ad blockers
  const jsEnabled = 99.2;
  const cookiesEnabled = 94.5;

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-500" />
          Visitor Technology
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Screen Resolutions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MonitorSmartphone className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Screen Resolutions
            </span>
          </div>
          <div className="space-y-2">
            {screenResolutions.slice(0, 4).map((res) => (
              <div key={res.resolution} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 font-mono">{res.resolution}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${res.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-10 text-right">
                  {res.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Connection Types */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Connection Type
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {connectionTypes.map((conn) => (
              <div key={conn.type} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">{conn.type}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {conn.percentage}%
                  </span>
                </div>
                <span className="text-xs text-gray-400">{conn.speed}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Languages className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Browser Languages
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <div
                key={lang.code}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <span className="text-gray-700 dark:text-gray-300">{lang.language}</span>
                <span className="text-gray-500 ml-1.5">{lang.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Browser Capabilities */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-emerald-600">{jsEnabled}%</p>
            <p className="text-xs text-gray-500">JS Enabled</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-blue-600">{cookiesEnabled}%</p>
            <p className="text-xs text-gray-500">Cookies On</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-amber-600">{adBlockUsage}%</p>
            <p className="text-xs text-gray-500">Ad Blockers</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
