import { supabase } from '@/lib/supabase';

export interface MTConnection {
  id: string;
  account_number: string;
  server: string;
  platform: 'mt4' | 'mt5';
  status: 'connected' | 'disconnected' | 'error';
  last_sync: string;
  error_message?: string;
}

export interface Trade {
  id: string;
  ticket_number: number;
  symbol: string;
  order_type: 'buy' | 'sell';
  lot_size: number;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  exit_price?: number;
  profit_loss?: number;
  commission: number;
  swap: number;
  open_time: string;
  close_time?: string;
  status: 'open' | 'closed' | 'cancelled';
  risk_reward_ratio?: number;
  risk_percentage?: number;
  strategy?: string;
  timeframe?: string;
  metrics?: {
    risk_amount: number;
    reward_amount: number;
    risk_reward_ratio: number;
    win_loss: 'win' | 'loss' | 'breakeven';
  };
  tags?: string[];
}

export interface MTReportTrade {
  ticket: string;
  openTime: string;
  closeTime?: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  commission: number;
  swap: number;
  profit: number;
}

export async function importMT5Report(userId: string, reportHtml: string): Promise<void> {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(reportHtml, 'text/html');
    const trades: MTReportTrade[] = [];

    // Parse trades from positions table
    const positionsTable = doc.querySelector('table tr th:contains("Posiciones")').closest('table');
    const positionRows = positionsTable.querySelectorAll('tr[bgcolor]');

    positionRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 13) {
        trades.push({
          ticket: cells[1].textContent.trim(),
          openTime: cells[0].textContent.trim(),
          closeTime: cells[8].textContent.trim() || undefined,
          symbol: cells[2].textContent.trim(),
          type: cells[3].textContent.trim().toLowerCase() as 'buy' | 'sell',
          volume: parseFloat(cells[4].textContent.trim()),
          openPrice: parseFloat(cells[5].textContent.trim()),
          closePrice: cells[9].textContent.trim() ? parseFloat(cells[9].textContent.trim()) : undefined,
          stopLoss: cells[6].textContent.trim() ? parseFloat(cells[6].textContent.trim()) : undefined,
          takeProfit: cells[7].textContent.trim() ? parseFloat(cells[7].textContent.trim()) : undefined,
          commission: parseFloat(cells[10].textContent.trim()),
          swap: parseFloat(cells[11].textContent.trim()),
          profit: parseFloat(cells[12].textContent.trim())
        });
      }
    });

    // Convert to our trade format and store in database
    const dbTrades = trades.map(trade => ({
      user_id: userId,
      ticket_number: parseInt(trade.ticket),
      symbol: trade.symbol,
      order_type: trade.type,
      lot_size: trade.volume,
      entry_price: trade.openPrice,
      exit_price: trade.closePrice,
      stop_loss: trade.stopLoss,
      take_profit: trade.takeProfit,
      profit_loss: trade.profit,
      commission: trade.commission,
      swap: trade.swap,
      open_time: new Date(trade.openTime).toISOString(),
      close_time: trade.closeTime ? new Date(trade.closeTime).toISOString() : null,
      status: trade.closeTime ? 'closed' : 'open'
    }));

    // Insert trades in batches
    const batchSize = 100;
    for (let i = 0; i < dbTrades.length; i += batchSize) {
      const batch = dbTrades.slice(i, i + batchSize);
      const { error } = await supabase
        .from('trades')
        .upsert(batch, { onConflict: 'ticket_number' });

      if (error) throw error;
    }

    // Calculate metrics for each trade
    for (const trade of dbTrades) {
      if (trade.status === 'closed') {
        const { error } = await supabase.rpc('calculate_trade_metrics', {
          trade_id: trade.id
        });
        if (error) throw error;
      }
    }
  } catch (error) {
    console.error('Failed to import MT5 report:', error);
    throw error;
  }
}

export async function getUserTrades(userId: string): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select(`
      *,
      metrics:trade_metrics (
        risk_amount,
        reward_amount,
        risk_reward_ratio,
        win_loss
      ),
      tags:trade_tags (
        tag
      ),
      notes:trade_notes (
        id,
        note_type,
        content,
        screenshot_url,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('open_time', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addTradeNote(
  tradeId: string,
  userId: string,
  noteType: 'pre_trade' | 'post_trade' | 'analysis',
  content: string,
  screenshotUrl?: string
) {
  const { data, error } = await supabase
    .from('trade_notes')
    .insert({
      trade_id: tradeId,
      user_id: userId,
      note_type: noteType,
      content,
      screenshot_url: screenshotUrl
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}