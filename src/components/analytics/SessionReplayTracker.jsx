import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function SessionReplayTracker() {
  useEffect(() => {
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const sessionStart = Date.now();
    let events = [];

    function captureEvent(eventType, data = {}) {
      events.push({
        session_id: sessionId,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        time_offset_ms: Date.now() - sessionStart,
        page_url: window.location.href,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        ...data,
      });

      if (events.length >= 10) {
        sendBatch();
      }
    }

    function sendBatch() {
      if (events.length === 0) {
        return;
      }

      base44.functions.invoke('trackSession', { events: [...events] }).catch(console.error);

      events = [];
    }

    // Track page view
    captureEvent('pageview');

    // Track clicks
    const handleClick = (e) => {
      captureEvent('click', {
        element_tag: e.target.tagName.toLowerCase(),
        element_text: e.target.innerText?.slice(0, 100),
        element_selector: e.target.id ? `#${e.target.id}` : e.target.className,
        x_position: e.clientX,
        y_position: e.clientY,
      });
    };

    // Track scrolling
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        captureEvent('scroll', {
          scroll_top: window.scrollY,
          scroll_left: window.scrollX,
        });
      }, 200);
    };

    // Track errors
    const handleError = (e) => {
      captureEvent('error', {
        error_message: e.message,
        error_stack: e.error?.stack,
      });
    };

    // Track page unload
    const handleUnload = () => {
      sendBatch();
    };

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);
    window.addEventListener('error', handleError);
    window.addEventListener('beforeunload', handleUnload);

    // Send batch every 5 seconds
    const interval = setInterval(sendBatch, 5000);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('error', handleError);
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(interval);
      sendBatch();
    };
  }, []);

  return null;
}
