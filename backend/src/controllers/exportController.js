import { generatePdfReport, generateCsvReport } from '../services/exportService.js';

function parseDateRange(req) {
  const { startDate, endDate, range } = req.query;

  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }

  const end = new Date();
  const start = new Date();
  const days = range === '90d' ? 90 : range === '7d' ? 7 : 30;
  start.setDate(start.getDate() - days);

  return { start, end };
}

export async function exportPdf(req, res) {
  try {
    const { start, end } = parseDateRange(req);
    await generatePdfReport({ res, site: req.site, startDate: start, endDate: end });
    // generatePdfReport pipes directly to res and calls doc.end() - nothing more to send
  } catch (err) {
    console.error('[exportPdf] error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  }
}

export async function exportCsv(req, res) {
  try {
    const { start, end } = parseDateRange(req);
    const reportType = req.query.type || 'timeseries';

    const csv = await generateCsvReport({
      site: req.site,
      startDate: start,
      endDate: end,
      reportType,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics-${reportType}-${req.site.siteId}-${Date.now()}.csv"`
    );
    res.send(csv);
  } catch (err) {
    console.error('[exportCsv] error:', err.message);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
}
