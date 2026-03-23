import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function HeatmapViewer({ pageUrl, heatmaps = [] }) {
  const [activeType, setActiveType] = useState('click');

  const clickHeatmap = heatmaps.find((h) => h.heatmap_type === 'click');
  const scrollHeatmap = heatmaps.find((h) => h.heatmap_type === 'scroll');

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Heatmaps</span>
          <Badge variant="outline">{pageUrl}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList>
            <TabsTrigger value="click">Click Map</TabsTrigger>
            <TabsTrigger value="scroll">Scroll Map</TabsTrigger>
            <TabsTrigger value="movement">Movement</TabsTrigger>
          </TabsList>

          <TabsContent value="click" className="mt-4">
            {clickHeatmap ? (
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-8 min-h-[400px]">
                <div className="text-center text-gray-500">
                  <p className="mb-2">Click Heatmap Preview</p>
                  <p className="text-sm">Based on {clickHeatmap.session_count} sessions</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {clickHeatmap.data_points?.slice(0, 9).map((point, idx) => (
                      <div
                        key={idx}
                        className="h-12 rounded"
                        style={{
                          backgroundColor: `rgba(239, 68, 68, ${point.intensity / 100})`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No click data available</p>
            )}
          </TabsContent>

          <TabsContent value="scroll" className="mt-4">
            {scrollHeatmap ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Scroll depth analysis</p>
                <div className="space-y-2">
                  {scrollHeatmap.data_points?.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm w-20">{point.element}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-6 rounded overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${point.intensity}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{point.intensity}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No scroll data available</p>
            )}
          </TabsContent>

          <TabsContent value="movement" className="mt-4">
            <p className="text-gray-500 text-center py-8">Movement tracking coming soon</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
