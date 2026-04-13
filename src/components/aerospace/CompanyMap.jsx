import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Location coordinates for major aerospace hubs
const locationCoords = {
  Seattle: [47.6062, -122.3321],
  'Los Angeles': [34.0522, -118.2437],
  Texas: [31.9686, -99.9018],
  Virginia: [37.4316, -78.6569],
  Maryland: [39.0458, -76.6413],
  Florida: [27.9944, -81.7603],
  California: [36.7783, -119.4179],
  Washington: [47.7511, -120.7401],
  'New York': [40.7128, -74.006],
  Arizona: [34.0489, -111.0937],
  Colorado: [39.5501, -105.7821],
  Alabama: [32.3182, -86.9023],
  Connecticut: [41.6032, -73.0877],
};

const getCoordinates = (location) => {
  if (!location) {
    return null;
  }
  for (const [city, coords] of Object.entries(locationCoords)) {
    if (location.includes(city)) {
      return coords;
    }
  }
  return null;
};

export default function CompanyMap({ companies }) {
  const companiesWithLocations = companies
    .map((c) => ({
      ...c,
      coords: getCoordinates(c.headquarters),
    }))
    .filter((c) => c.coords);

  if (companiesWithLocations.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Company Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No location data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          Aerospace Company Headquarters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200">
          <MapContainer
            center={[39.8283, -98.5795]}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {companiesWithLocations.map((company, idx) => (
              <Marker key={idx} position={company.coords}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-sm mb-1">{company.company_name}</h3>
                    <p className="text-xs text-gray-600 mb-1">{company.headquarters}</p>
                    {company.ticker_symbol && (
                      <Badge className="text-xs">{company.ticker_symbol}</Badge>
                    )}
                    {company.employee_count && (
                      <p className="text-xs text-gray-500 mt-1">
                        {company.employee_count.toLocaleString()} employees
                      </p>
                    )}
                  </div>
                </Popup>
                {company.growth_metrics?.expansion_markets?.length > 0 && (
                  <Circle
                    center={company.coords}
                    radius={100000}
                    pathOptions={{
                      color: '#3b82f6',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.1,
                    }}
                  />
                )}
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Expansion Markets Legend */}
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Expansion Markets
          </h4>
          <div className="space-y-2">
            {companiesWithLocations
              .filter((c) => c.growth_metrics?.expansion_markets?.length > 0)
              .map((company, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-medium">{company.company_name}:</span>{' '}
                  <span className="text-gray-600">
                    {company.growth_metrics.expansion_markets.join(', ')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}