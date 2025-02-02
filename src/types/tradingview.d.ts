interface TradingViewWidget {
  widget(config: {
    container_id?: string;
    container?: HTMLElement;
    width?: string | number;
    height?: string | number;
    symbol?: string;
    interval?: string;
    timezone?: string;
    theme?: string;
    style?: string;
    locale?: string;
    toolbar_bg?: string;
    enable_publishing?: boolean;
    hide_side_toolbar?: boolean;
    allow_symbol_change?: boolean;
    details?: boolean;
    hotlist?: boolean;
    calendar?: boolean;
    show_popup_button?: boolean;
    popup_width?: string;
    popup_height?: string;
    withdateranges?: boolean;
    hide_volume?: boolean;
    studies?: string[];
    [key: string]: any;
  }): void;
}

declare global {
  interface Window {
    TradingView: TradingViewWidget;
  }
}

export {};