import React, { useEffect, useRef } from 'react';
import { Trade } from '@/services/mt';
import { GanttChartSquare as ChartSquare } from 'lucide-react';

interface TradeChartsProps {
  trades: Trade[];
}

export function TradeCharts({ trades }: TradeChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && window.TradingView) {
        new window.TradingView.widget({
          container_id: 'tradingview_chart',
          width: '100%',
          height: window.innerWidth < 768 ? 400 : 600,
          symbol: 'EURUSD',
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1f2937',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          details: true,
          hotlist: true,
          calendar: true,
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          withdateranges: true,
          hide_volume: false,
          studies: [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies'
          ],
          container: containerRef.current
        });
      }
    };
    document.head.appendChild(script);

    // Handle resize
    const handleResize = () => {
      if (containerRef.current) {
        containerRef.current.style.height = `${window.innerWidth < 768 ? 400 : 600}px`;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      script.remove();
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6">
      <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
        <ChartSquare className="w-5 h-5 text-trading-accent" />
        Trading Charts
      </h2>

      <div 
        id="tradingview_chart"
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: window.innerWidth < 768 ? 400 : 600 }}
      />
    </div>
  );
}