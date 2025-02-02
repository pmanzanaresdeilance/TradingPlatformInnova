import { supabase } from '@/lib/supabase';

interface MT5Trade {
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

function parseNumericValue(value: string): number | null {
  if (!value || value === '-') return null;
  // Remove any non-numeric characters except dots and minus signs
  const cleanValue = value.replace(/[^\d.-]/g, '');
  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? null : numValue;
}

function formatPrice(symbol: string, price: number): number {
  if (symbol.includes('JPY')) {
    return parseFloat(price.toFixed(3));
  } else if (symbol.startsWith('XAU')) {
    return parseFloat(price.toFixed(2));
  } else if (symbol.includes('US30') || symbol.includes('GER40')) {
    return parseFloat(price.toFixed(1));
  }
  return parseFloat(price.toFixed(5));
}

function parseDateTime(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;
  
  // Try parsing the date string
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // If standard parsing fails, try custom format
  const parts = dateStr.split(' ');
  if (parts.length === 2) {
    const [datePart, timePart] = parts;
    const [year, month, day] = datePart.split('.').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    
    const date = new Date(year, month - 1, day, hour, minute, second);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

export async function importMT5Report(userId: string, reportHtml: string): Promise<void> {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(reportHtml, 'text/html');
    const trades: MT5Trade[] = [];

    // Find the positions table
    const positionsTable = Array.from(doc.querySelectorAll('table')).find(table => {
      const headers = table.querySelectorAll('th');
      return Array.from(headers).some(th => 
        th.textContent?.includes('Posiciones') || 
        th.textContent?.includes('Positions')
      );
    });

    if (!positionsTable) {
      throw new Error('Could not find positions table in the report');
    }

    // Process each row
    const rows = positionsTable.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 13) { // Make sure we have enough cells
        try {
          // Get ticket number
          const ticketStr = cells[1]?.textContent?.trim();
          if (!ticketStr) return;
          
          const ticketNum = parseInt(ticketStr);
          if (isNaN(ticketNum)) return;

          // Get trade type
          const type = cells[3]?.textContent?.trim().toLowerCase();
          if (type !== 'buy' && type !== 'sell') return;

          // Get symbol
          const symbol = cells[2]?.textContent?.trim();
          if (!symbol) return;

          // Parse volume and prices
          const volume = parseNumericValue(cells[4]?.textContent || '');
          const openPrice = parseNumericValue(cells[5]?.textContent || '');
          if (!volume || !openPrice) return;

          // Parse dates
          const openTime = parseDateTime(cells[0]?.textContent || '');
          if (!openTime) return;

          // Optional fields
          const stopLoss = parseNumericValue(cells[6]?.textContent || '');
          const takeProfit = parseNumericValue(cells[7]?.textContent || '');
          const closeTime = parseDateTime(cells[8]?.textContent || '');
          const closePrice = parseNumericValue(cells[9]?.textContent || '');
          const commission = parseNumericValue(cells[10]?.textContent || '') || 0;
          const swap = parseNumericValue(cells[11]?.textContent || '') || 0;
          const profit = parseNumericValue(cells[12]?.textContent || '') || 0;

          trades.push({
            ticket: ticketNum.toString(),
            openTime: openTime.toISOString(),
            closeTime: closeTime?.toISOString(),
            symbol,
            type: type as 'buy' | 'sell',
            volume,
            openPrice: formatPrice(symbol, openPrice),
            closePrice: closePrice ? formatPrice(symbol, closePrice) : undefined,
            stopLoss: stopLoss ? formatPrice(symbol, stopLoss) : undefined,
            takeProfit: takeProfit ? formatPrice(symbol, takeProfit) : undefined,
            commission,
            swap,
            profit
          });
        } catch (err) {
          console.error('Error parsing trade row:', err);
        }
      }
    });

    if (trades.length === 0) {
      throw new Error('No valid trades found in the report');
    }

    // Convert to database format
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
      open_time: trade.openTime,
      close_time: trade.closeTime,
      status: trade.closeTime ? 'closed' : 'open'
    }));

    // Insert trades in batches
    const batchSize = 50;
    for (let i = 0; i < dbTrades.length; i += batchSize) {
      const batch = dbTrades.slice(i, i + batchSize);
      const { error } = await supabase
        .from('trades')
        .upsert(batch, {
          onConflict: 'ticket_number',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Error inserting trades batch:', error);
        throw new Error('Failed to save trades to database');
      }
    }

    console.log(`Successfully imported ${trades.length} trades`);
  } catch (error) {
    console.error('Failed to import MT5 report:', error);
    throw error;
  }
}