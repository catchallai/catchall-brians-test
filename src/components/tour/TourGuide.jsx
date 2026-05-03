import React, { useEffect, useState } from 'react';
import 'shepherd.js/dist/shepherd.css';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useProductTour } from '@/hooks/useProductTour';

export default function TourGuide({ tourName, className = '' }) {
  const { startTour } = useProductTour(tourName);
  const [hasCompleted, setHasCompleted] = useState(() => {
    return localStorage.getItem(`tour-${tourName}-completed`) === 'true';
  });

  const handleStartTour = () => {
    const tour = startTour(tourName);
    if (tour) {
      tour.on('complete', () => {
        localStorage.setItem(`tour-${tourName}-completed`, 'true');
        setHasCompleted(true);
      });
      tour.on('cancel', () => {
        localStorage.setItem(`tour-${tourName}-started`, 'true');
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleStartTour}
      className={className}
      title={hasCompleted ? 'Replay tour' : 'Start guided tour'}
    >
      <HelpCircle className="w-4 h-4 mr-2" />
      {hasCompleted ? 'Replay Tour' : 'Start Tour'}
    </Button>
  );
}