import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  interval?: string;
}

export function TradingViewWidget({
  symbol = 'NASDAQ:AAPL',
  theme = 'dark',
  autosize = true,
  interval = 'D'
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const loadTradingViewScript = () => {
      return new Promise((resolve, reject) => {
        if (window.TradingView) {
          resolve(window.TradingView);
          return;
        }

        const script = document.createElement('script');
        script.id = 'tradingview-widget-script';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.type = 'text/javascript';
        script.async = true;
        script.onload = () => resolve(window.TradingView);
        script.onerror = reject;

        document.head.appendChild(script);
      });
    };

    const initWidget = async () => {
      try {
        await loadTradingViewScript();
        setScriptLoaded(true);

        if (container.current && window.TradingView) {
          new window.TradingView.widget({
            container_id: 'tradingview_widget',
            width: '100%',
            height: '100%',
            symbol: symbol,
            interval: interval,
            timezone: 'Etc/UTC',
            theme: theme,
            style: '1',
            locale: 'en',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: true,
            hide_top_toolbar: false,
            hide_side_toolbar: false,
            withdateranges: true,
            save_image: false,
            studies: [
              'MASimple@tv-basicstudies',
              'RSI@tv-basicstudies',
              'MACD@tv-basicstudies'
            ],
            disabled_features: [
              'use_localstorage_for_settings'
            ],
            enabled_features: [
              'study_templates'
            ]
          });
        }
      } catch (error) {
        console.error('Failed to load TradingView widget:', error);
      }
    };

    initWidget();

    return () => {
      const script = document.getElementById('tradingview-widget-script');
      if (script) {
        script.remove();
      }
      setScriptLoaded(false);
    };
  }, [symbol, theme, interval]);

  return (
    <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden">
      {!scriptLoaded && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trading-accent"></div>
        </div>
      )}
      <div 
        id="tradingview_widget" 
        ref={container}
        className="w-full h-full"
        style={{ display: scriptLoaded ? 'block' : 'none' }}
      />
    </div>
  );
}