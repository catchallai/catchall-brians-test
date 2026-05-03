import { useCallback } from 'react';
import Shepherd from 'shepherd.js';
import { tourSteps } from '@/lib/tourSteps';

export function useProductTour(tourName) {
  const createTour = useCallback((steps) => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shadow-lg bg-white dark:bg-slate-800 rounded-lg',
        scrollTo: true,
        cancelIcon: {
          enabled: true,
        },
      },
    });

    steps.forEach((step) => {
      tour.addStep({
        id: step.id,
        title: step.title,
        text: step.text,
        attachTo: step.attachTo,
        buttons: step.buttons.map((btn) => ({
          action: btn.action === 'back' ? () => tour.back() : 
                   btn.action === 'next' ? () => tour.next() :
                   btn.action === 'complete' ? () => tour.complete() :
                   btn.action,
          text: btn.text,
          classes: btn.classes || '',
        })),
      });
    });

    return tour;
  }, []);

  const startTour = useCallback((name) => {
    const steps = tourSteps[name];
    if (!steps) {
      console.warn(`Tour "${name}" not found`);
      return null;
    }

    const tour = createTour(steps);
    tour.start();
    return tour;
  }, [createTour]);

  return { startTour, createTour };
}