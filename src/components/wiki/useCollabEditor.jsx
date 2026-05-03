import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { QuillBinding } from 'y-quill';

/**
 * Manages a Yjs document + WebRTC provider + Quill binding for a given page.
 *
 * @param {string|null} pageId   - Wiki page ID (room name)
 * @param {object|null} user     - Current user { email, full_name }
 * @param {Function}    onUpdate - Called with the latest HTML string whenever content changes
 * @returns {{ quillRef, isConnected, connectedUsers }}
 */
export function useCollabEditor(pageId, user, onUpdate) {
  const quillRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);

  useEffect(() => {
    if (!pageId || !user) return;

    // --- 1. Yjs document ---
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // --- 2. WebRTC provider (p2p, no extra server needed) ---
    const provider = new WebrtcProvider(`catchall-wiki-${pageId}`, ydoc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'],
    });
    providerRef.current = provider;

    // Awareness: broadcast this user's cursor colour + name
    const colors = ['#7c3aed', '#0891b2', '#16a34a', '#ea580c', '#db2777', '#ca8a04'];
    const colorIndex = user.email.length % colors.length;
    provider.awareness.setLocalStateField('user', {
      name: user.full_name || user.email.split('@')[0],
      color: colors[colorIndex],
      email: user.email,
    });

    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      const users = states
        .filter((s) => s.user && s.user.email !== user.email)
        .map((s) => s.user);
      setConnectedUsers(users);
    });

    provider.on('status', ({ connected }) => setIsConnected(connected));

    // --- 3. Attach binding once Quill is ready ---
    const attachBinding = () => {
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;

      const yText = ydoc.getText('content');
      const binding = new QuillBinding(yText, quill, provider.awareness);
      bindingRef.current = binding;

      // Forward content changes to the parent component
      quill.on('text-change', () => {
        onUpdate?.(quill.root.innerHTML);
      });
    };

    // Give ReactQuill a tick to mount
    const timer = setTimeout(attachBinding, 150);

    return () => {
      clearTimeout(timer);
      bindingRef.current?.destroy();
      providerRef.current?.destroy();
      ydocRef.current?.destroy();
      bindingRef.current = null;
      providerRef.current = null;
      ydocRef.current = null;
    };
  }, [pageId, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  return { quillRef, isConnected, connectedUsers };
}