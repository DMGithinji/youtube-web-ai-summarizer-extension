import React, { useEffect, useState } from 'react';

import { getCurrentVideoId } from '@/lib/utils';
import useMobile from '../hooks/useMobile';
import { ROOT_ID } from '../main';
import { YTSummarizer } from './YTSummarizer';

export const YTSummarizerRoot: React.FC = () => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const isMobile = useMobile();

  // Effect to handle mounting for both mobile and desktop
  useEffect(() => {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    if (isMobile) {
      // For mobile, set position fixed
      root.style.position = 'fixed';
      root.style.bottom = '20px';
      root.style.right = '20px';
      root.style.zIndex = '999999';
      // Ensure it's in the body
      if (root.parentElement !== document.body) {
        document.body.appendChild(root);
      }
    } else {
      // Reset mobile styles if they were applied
      root.style.position = '';
      root.style.bottom = '';
      root.style.right = '';
      root.style.zIndex = '';

      // Desktop mounting logic
      const secondary = document.querySelector('#secondary');
      if (secondary) {
        if (secondary.firstChild) {
          secondary.insertBefore(root, secondary.firstChild);
        } else {
          secondary.appendChild(root);
        }
      } else {
        const observer = new MutationObserver((_, obs) => {
          const secondary = document.querySelector('#secondary');
          if (secondary) {
            if (secondary.firstChild) {
              secondary.insertBefore(root, secondary.firstChild);
            } else {
              secondary.appendChild(root);
            }
            obs.disconnect();
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        return () => observer.disconnect();
      }
    }
  }, [isMobile]);

  // Update videoId when URL changes
  useEffect(() => {
    const handleNavigation = () => {
      setVideoId(getCurrentVideoId());
    };

    window.addEventListener('yt-navigate-finish', handleNavigation);
    setVideoId(getCurrentVideoId()); // Initial video ID

    return () => {
      window.removeEventListener('yt-navigate-finish', handleNavigation);
    };
  }, []);

  return (
    <YTSummarizer
      key={videoId} // Force reset on video change
      displayMode={isMobile ? 'floating' : 'tab'}
    />
  );
};
