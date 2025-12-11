/**
 * Tests for WebViewScreen component
 * Coverage target: 75%
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import WebViewScreen from '../../src/screens/WebViewScreen';
import { createMockRoute } from '../setup/mocks';

// Mock WebView
jest.mock('react-native-webview', () => ({
  WebView: 'WebView'
}));

// Mock fetch
global.fetch = jest.fn();

describe('WebViewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Not found'));
  });

  describe('Loading state', () => {
    it('should show loading indicator initially', () => {
      const route = createMockRoute('WebView', { name: 'Berlin' });
      const { getByText } = render(<WebViewScreen route={route} />);
      
      expect(getByText('Lade Seite...')).toBeTruthy();
    });

    it('should display location name in header', () => {
      const route = createMockRoute('WebView', { name: 'Brandenburg Gate' });
      const { getByText } = render(<WebViewScreen route={route} />);
      
      expect(getByText('Brandenburg Gate')).toBeTruthy();
    });
  });

  describe('URL selection', () => {
    it('should try Wikitravel first', async () => {
      const route = createMockRoute('WebView', { name: 'Berlin' });
      render(<WebViewScreen route={route} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://wikitravel.org/de/Berlin',
          expect.any(Object)
        );
      });
    });

    it('should use Wikitravel if available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      
      const route = createMockRoute('WebView', { name: 'Berlin' });
      const { getByText } = render(<WebViewScreen route={route} />);
      
      await waitFor(() => {
        expect(getByText('📚 Wikitravel')).toBeTruthy();
      });
    });

    it('should fall back to Wikipedia if Wikitravel fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      
      const route = createMockRoute('WebView', { name: 'Berlin' });
      const { getByText } = render(<WebViewScreen route={route} />);
      
      await waitFor(() => {
        expect(getByText('📚 Wikipedia')).toBeTruthy();
      });
    });

    it('should encode location name with underscores', async () => {
      const route = createMockRoute('WebView', { name: 'Brandenburg Gate' });
      render(<WebViewScreen route={route} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://wikitravel.org/de/Brandenburg_Gate',
          expect.any(Object)
        );
      });
    });

    it('should handle special characters in location name', async () => {
      const route = createMockRoute('WebView', { name: 'Café Müller' });
      render(<WebViewScreen route={route} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('WebView rendering', () => {
    it('should render WebView after loading', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      
      const route = createMockRoute('WebView', { name: 'Berlin' });
      const { queryByText, UNSAFE_getByType } = render(<WebViewScreen route={route} />);
      
      await waitFor(() => {
        expect(queryByText('Lade Seite...')).toBeNull();
      });
      
      const webView = UNSAFE_getByType('WebView');
      expect(webView).toBeTruthy();
      expect(webView.props.source.uri).toContain('wikipedia.org');
    });

    it('should pass correct URL to WebView', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      
      const route = createMockRoute('WebView', { name: 'Test Location' });
      const { UNSAFE_getByType } = render(<WebViewScreen route={route} />);
      
      await waitFor(() => {
        const webView = UNSAFE_getByType('WebView');
        expect(webView.props.source.uri).toContain('wikitravel.org');
        expect(webView.props.source.uri).toContain('Test_Location');
      });
    });
  });

  describe('Timeout handling', () => {
    it('should abort fetch after 3 seconds', async () => {
      jest.useFakeTimers();
      
      const abortController = new AbortController();
      const abortSpy = jest.spyOn(abortController, 'abort');
      
      // Mock AbortController
      global.AbortController = jest.fn(() => abortController) as any;
      
      const route = createMockRoute('WebView', { name: 'Berlin' });
      render(<WebViewScreen route={route} />);
      
      // Fast-forward time by 3 seconds
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(abortSpy).toHaveBeenCalled();
      });
      
      jest.useRealTimers();
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const route = createMockRoute('WebView', { name: 'Berlin' });
      const { getByText } = render(<WebViewScreen route={route} />);
      
      await waitFor(() => {
        expect(getByText('📚 Wikipedia')).toBeTruthy();
      });
      
      expect(consoleLog).toHaveBeenCalledWith('Wikitravel not found, trying Wikipedia');
      consoleLog.mockRestore();
    });
  });

  describe('Reload on name change', () => {
    it('should reload when location name changes', async () => {
      const route = createMockRoute('WebView', { name: 'Berlin' });
      const { rerender, getByText } = render(<WebViewScreen route={route} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
      
      const newRoute = createMockRoute('WebView', { name: 'Munich' });
      rerender(<WebViewScreen route={newRoute} />);
      
      await waitFor(() => {
        expect(getByText('Munich')).toBeTruthy();
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
