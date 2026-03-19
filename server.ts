import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import yahooFinance from 'yahoo-finance2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Sync endpoint for real-time data
  app.post('/api/sync', async (req, res) => {
    const { assets } = req.body;
    if (!assets || !Array.isArray(assets)) {
      return res.status(400).json({ error: 'Invalid assets list' });
    }

    try {
      // Map tickers to Yahoo Finance symbols
      const symbolMap = assets.reduce((acc: any, asset: any) => {
        let symbol = asset.ticker;
        if (asset.seg === 'IN') {
          symbol = `${asset.ticker}.NS`;
        }
        acc[symbol] = asset.ticker;
        return acc;
      }, {});

      const symbols = Object.keys(symbolMap);
      
      // Fetch quotes in batch
      const quotes: any[] = await yahooFinance.quote(symbols);
      
      const results = (Array.isArray(quotes) ? quotes : [quotes]).map((quote: any) => {
        const ticker = symbolMap[quote.symbol];
        const asset = assets.find((a: any) => a.ticker === ticker);
        
        return {
          ticker,
          curr: quote.regularMarketPrice,
          pe: quote.trailingPE || (asset ? asset.pe : 'N/A'),
          mktCap: quote.marketCap ? (quote.symbol.endsWith('.NS') ? `₹${(quote.marketCap / 1e7).toFixed(2)} Cr` : `$${(quote.marketCap / 1e12).toFixed(2)}T`) : (asset ? asset.mktCap : 'N/A'),
          lastUpdated: new Date().toISOString()
        };
      });

      // Handle symbols that failed or were not returned
      const returnedTickers = new Set(results.map(r => r.ticker));
      const missingResults = assets
        .filter(a => !returnedTickers.has(a.ticker))
        .map(a => ({ ticker: a.ticker, error: true }));

      res.json({ results: [...results, ...missingResults] });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ error: 'Failed to sync data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
