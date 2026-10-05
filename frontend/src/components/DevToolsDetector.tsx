import React, { useState, useEffect, useRef } from 'react';
import { Box, Alert, Typography, IconButton, Chip, Collapse } from '@mui/material';
import {
  WarningAmber as WarningIcon,
  Close as CloseIcon,
  ShieldOutlined as ShieldIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DevToolsDetector: React.FC = () => {
  const { user, logSecurityEvent } = useAuth();
  const location = useLocation();

  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [repeatedViolationCount, setRepeatedViolationCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);

  const lastLoggedTimeRef = useRef<number>(0);
  const triggerTimesRef = useRef<number[]>([]);

  // Check if current route is a sensitive page
  const isSensitivePage = [
    '/approvals',
    '/employees',
    '/user-management',
    '/masters',
    '/reports',
    '/login-logs',
  ].some((path) => location.pathname.startsWith(path));

  // Handler to trigger security alert
  const handleDevToolsDetected = async (source: string) => {
    const now = Date.now();
    // Debounce detections (at least 2.5 seconds between triggers)
    if (now - lastLoggedTimeRef.current < 2500) return;
    lastLoggedTimeRef.current = now;

    const recentTimes = triggerTimesRef.current.filter((t) => now - t < 5 * 60 * 1000);
    recentTimes.push(now);
    triggerTimesRef.current = recentTimes;

    const count = recentTimes.length;
    setRepeatedViolationCount(count);
    setDevToolsOpen(true);
    setShowBanner(true);

    if (count > 3) {
      setIsEscalated(true);
    }

    // Report to backend audit
    try {
      const result = await logSecurityEvent({
        eventType: count > 3 ? 'DEVTOOLS_REPEATED' : 'DEVTOOLS_DETECTED',
        pageUrl: window.location.pathname,
        details: `DevTools / Inspector opened via ${source} on ${window.location.pathname}. Repeated instances in 5m: ${count}`,
      });

      if (result?.escalated) {
        setIsEscalated(true);
      }
    } catch (e) {
      console.warn('DevTools event reporting note:', e);
    }
  };

  useEffect(() => {
    // 1. Keyboard Shortcut Traps (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Cmd+Option+I, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        handleDevToolsDetected('F12 shortcut');
        return false;
      }

      // Ctrl + Shift + I / Cmd + Option + I
      if (ctrlOrCmd && (e.shiftKey || (isMac && e.altKey)) && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        e.stopPropagation();
        handleDevToolsDetected('Ctrl+Shift+I / Inspect shortcut');
        return false;
      }

      // Ctrl + Shift + J / Cmd + Option + J (Console)
      if (ctrlOrCmd && (e.shiftKey || (isMac && e.altKey)) && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        e.stopPropagation();
        handleDevToolsDetected('Ctrl+Shift+J / Console shortcut');
        return false;
      }

      // Ctrl + Shift + C / Cmd + Option + C (Element selector)
      if (ctrlOrCmd && (e.shiftKey || (isMac && e.altKey)) && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        handleDevToolsDetected('Ctrl+Shift+C / Element Inspect shortcut');
        return false;
      }

      // Ctrl + U (View Source)
      if (ctrlOrCmd && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        handleDevToolsDetected('Ctrl+U / View Source shortcut');
        return false;
      }
    };

    // 2. Right-Click Context Menu Override on Sensitive Pages
    const handleContextMenu = (e: MouseEvent) => {
      if (isSensitivePage) {
        e.preventDefault();
        handleDevToolsDetected('Right-Click Context Menu (Sensitive Mode)');
        return false;
      }
    };

    // 3. Window Resize / Outer-Inner Diff Heuristic (DevTools dock detection)
    let resizeTimer: any;
    const checkWindowThreshold = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if (widthThreshold || heightThreshold) {
        handleDevToolsDetected('Window Dimension Differential (Docked DevTools)');
      } else {
        // If closed, we keep banner dismissable
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkWindowThreshold, 400);
    };

    // 4. Debugger Timing Check (Behavioral Heuristic)
    const runTimingHeuristic = () => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      (function () {}.constructor('debugger')());
      const end = performance.now();
      if (end - start > 100) {
        handleDevToolsDetected('Debugger Execution Pause');
      }
    };

    const timingInterval = setInterval(runTimingHeuristic, 4000);

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('resize', handleResize);
      clearInterval(timingInterval);
      clearTimeout(resizeTimer);
    };
  }, [isSensitivePage, user, location.pathname]);

  // Apply or remove blur style on sensitive table/form elements when DevTools is detected
  useEffect(() => {
    const sensitiveElements = document.querySelectorAll(
      '.sensitive-data-container, table, form, .MuiTable-root, .MuiCard-root'
    );

    if (devToolsOpen && isSensitivePage) {
      document.body.classList.add('devtools-security-blur');
    } else {
      document.body.classList.remove('devtools-security-blur');
    }

    return () => {
      document.body.classList.remove('devtools-security-blur');
    };
  }, [devToolsOpen, isSensitivePage]);

  if (!showBanner) return null;

  return (
    <Collapse in={showBanner}>
      <Box
        sx={{
          position: 'sticky',
          top: 64,
          zIndex: 9999,
          width: '100%',
          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.25)',
        }}
      >
        <Alert
          severity={isEscalated ? 'error' : 'warning'}
          icon={<WarningIcon sx={{ fontSize: 24 }} />}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isEscalated && (
                <Chip
                  label="ESCALATED TO ADMIN"
                  size="small"
                  color="error"
                  sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                />
              )}
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setShowBanner(false);
                  setDevToolsOpen(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </Box>
          }
          sx={{
            borderRadius: 0,
            py: 1,
            px: 3,
            bgcolor: isEscalated ? '#FEF2F2' : '#FFFBEB',
            borderBottom: isEscalated ? '2px solid #EF4444' : '2px solid #F59E0B',
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isEscalated ? '#991B1B' : '#92400E' }}>
                {isEscalated
                  ? 'CRITICAL SECURITY BREACH ALERT: Repeated Developer Tools Inspection Detected'
                  : 'Developer Tools Detected: Unauthorized access attempts are logged and monitored.'}
              </Typography>
              <Typography variant="caption" sx={{ color: isEscalated ? '#B91C1C' : '#78350F', display: 'block' }}>
                {isEscalated
                  ? `You have opened DevTools ${repeatedViolationCount} times within 5 minutes. An automated security event and incident notification have been dispatched to System Administrators. Continued use of inspection tools will result in immediate account suspension.`
                  : 'Continued use of DevTools or element inspectors on secure CRM pages is prohibited by enterprise security policy. Sensitive tables and forms are protected. Contact your administrator if you have questions.'}
              </Typography>
            </Box>
          </Box>
        </Alert>
      </Box>
    </Collapse>
  );
};
