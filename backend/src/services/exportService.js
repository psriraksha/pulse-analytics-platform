import PDFDocument from 'pdfkit';
import { Parser as CsvParser } from 'json2csv';
import { getFullDashboardData } from './analyticsService.js';

/**
 * Streams a PDF analytics report directly to the HTTP response.
 * Uses PDFKit's streaming API so we never hold the whole file in memory.
 */
export async function generatePdfReport({ res, site, startDate, endDate }) {
  const data = await getFullDashboardData(site.siteId, startDate, endDate);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="analytics-report-${site.siteId}-${Date.now()}.pdf"`
  );

  doc.pipe(res);

  // --- Header ---
  doc
    .fontSize(22)
    .fillColor('#1a1a2e')
    .text('Analytics Report', { align: 'left' });

  doc
    .fontSize(11)
    .fillColor('#555')
    .text(`Site: ${site.name} (${site.domain})`)
    .text(`Period: ${startDate.toDateString()} — ${endDate.toDateString()}`)
    .moveDown(1.5);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke();
  doc.moveDown(1);

  // --- Overview metrics ---
  doc.fontSize(14).fillColor('#1a1a2e').text('Overview', { underline: false });
  doc.moveDown(0.5);

  const metrics = [
    ['Total Page Views', data.overview.totalPageViews.toLocaleString()],
    ['Total Sessions', data.overview.totalSessions.toLocaleString()],
    ['Unique Visitors', data.overview.uniqueVisitors.toLocaleString()],
    ['Bounce Rate', `${data.overview.bounceRate}%`],
    ['Avg. Session Duration', `${Math.round(data.overview.avgSessionDurationMs / 1000)}s`],
  ];

  metrics.forEach(([label, value]) => {
    doc
      .fontSize(11)
      .fillColor('#333')
      .text(label, 50, doc.y, { continued: true, width: 250 })
      .fillColor('#1a1a2e')
      .text(value, { align: 'right' });
  });

  doc.moveDown(1.5);

  // --- Top Pages ---
  drawTable(doc, 'Top Pages', ['Path', 'Views'], data.topPages.map((p) => [p.path, p.views]));

  // --- Device Breakdown ---
  drawTable(
    doc,
    'Device Breakdown',
    ['Device', 'Count'],
    data.deviceBreakdown.map((d) => [d.device, d.count])
  );

  // --- Top Referrers ---
  if (data.topReferrers.length > 0) {
    drawTable(
      doc,
      'Top Referrers',
      ['Referrer', 'Sessions'],
      data.topReferrers.map((r) => [r.referrer, r.count])
    );
  }

  // --- Top Custom Events ---
  if (data.topEvents.length > 0) {
    drawTable(
      doc,
      'Top Custom Events',
      ['Event', 'Count'],
      data.topEvents.map((e) => [e.eventName, e.count])
    );
  }

  doc
    .fontSize(8)
    .fillColor('#999')
    .text(`Generated on ${new Date().toUTCString()}`, 50, 780, { align: 'center' });

  doc.end();
}

function drawTable(doc, title, headers, rows) {
  if (doc.y > 680) doc.addPage();

  doc.fontSize(14).fillColor('#1a1a2e').text(title);
  doc.moveDown(0.3);

  const colWidth = 247;
  const startX = 50;
  let y = doc.y;

  doc.fontSize(10).fillColor('#fff');
  doc.rect(startX, y, colWidth * 2, 20).fill('#1a1a2e');
  doc.fillColor('#fff').text(headers[0], startX + 8, y + 5, { width: colWidth - 16 });
  doc.text(headers[1], startX + colWidth + 8, y + 5, { width: colWidth - 16, align: 'right' });

  y += 20;

  rows.slice(0, 15).forEach((row, i) => {
    if (y > 740) {
      doc.addPage();
      y = 50;
    }
    const bg = i % 2 === 0 ? '#f7f7fb' : '#ffffff';
    doc.rect(startX, y, colWidth * 2, 18).fill(bg);
    doc
      .fillColor('#333')
      .fontSize(9)
      .text(String(row[0]), startX + 8, y + 4, { width: colWidth - 16 });
    doc.text(String(row[1]), startX + colWidth + 8, y + 4, { width: colWidth - 16, align: 'right' });
    y += 18;
  });

  doc.y = y + 15;
}

/**
 * Generates a CSV export and returns it as a string for the controller to send.
 */
export async function generateCsvReport({ site, startDate, endDate, reportType }) {
  const data = await getFullDashboardData(site.siteId, startDate, endDate);

  let rows = [];
  let fields = [];

  switch (reportType) {
    case 'pages':
      fields = ['path', 'views'];
      rows = data.topPages;
      break;
    case 'devices':
      fields = ['device', 'count'];
      rows = data.deviceBreakdown;
      break;
    case 'referrers':
      fields = ['referrer', 'count'];
      rows = data.topReferrers;
      break;
    case 'events':
      fields = ['eventName', 'count'];
      rows = data.topEvents;
      break;
    case 'timeseries':
    default:
      fields = ['date', 'views', 'uniqueVisitors'];
      rows = data.timeSeries;
      break;
  }

  const parser = new CsvParser({ fields });
  return parser.parse(rows);
}
