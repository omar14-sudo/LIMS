// server/routes/reports.js
const express = require('express');
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const router = express.Router();


function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'غير مصرح بالدخول' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'التوثيق غير صالح' });
  }
}




// GET /api/reports/financial — تقرير مالي حسب تاريخ
router.get('/financial', (req, res) => {
  const { start, end } = req.query;

  const sql = `
    SELECT 
      t.name_ar AS test_name,
      COUNT(s.id) AS count,
      SUM(t.price) AS total_revenue
    FROM samples s
    JOIN tests t ON s.test_type_id = t.id
    WHERE s.status = 'completed'
      AND DATE(s.result_date) BETWEEN ? AND ?
    GROUP BY t.id
    ORDER BY total_revenue DESC
  `;

  db.all(sql, [start, end], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب التقرير المالي' });
    }
    res.json(rows);
  });
});
// GET /api/reports/export — تصدير التقرير
router.get('/export', async (req, res) => {
  const { format, start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'يجب تحديد تاريخ البداية والنهاية' });
  }

  try {
    // جلب البيانات من قاعدة البيانات
    const sql = `
      SELECT 
        t.name_ar AS test_name,
        COUNT(s.id) AS count,
        SUM(t.price) AS total_revenue
      FROM samples s
      JOIN tests t ON s.test_type_id = t.id
      WHERE s.status = 'completed'
        AND DATE(s.result_date) BETWEEN ? AND ?
      GROUP BY t.id
      ORDER BY total_revenue DESC
    `;

    const rows = await new Promise((resolve, reject) => {
      db.all(sql, [start, end], (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    if (format === 'pdf') {
      // تصدير PDF
      const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // العنوان
      page.drawText('تقرير مالي - نظام إدارة المعامل', {
        x: 50,
        y: 750,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // الفترة الزمنية
      page.drawText(`الفترة: من ${start} إلى ${end}`, {
        x: 50,
        y: 720,
        size: 14,
        font: font,
        color: rgb(0, 0, 0),
      });

      // حساب الإجماليات
      let totalRevenue = 0;
      let totalSamples = 0;
      rows.forEach(row => {
        totalRevenue += row.total_revenue || 0;
        totalSamples += row.count || 0;
      });

      // الإجماليات
      page.drawText(`إجمالي الإيرادات: ${totalRevenue.toFixed(2)} ج.م`, {
        x: 50,
        y: 690,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(`إجمالي العينات: ${totalSamples}`, {
        x: 50,
        y: 670,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // جدول التفاصيل
      let yPosition = 630;
      page.drawText('تفاصيل التحاليل:', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      // عناوين الأعمدة
      page.drawText('اسم التحليل', { x: 50, y: yPosition, size: 12, font: boldFont });
      page.drawText('عدد العينات', { x: 250, y: yPosition, size: 12, font: boldFont });
      page.drawText('الإيرادات', { x: 400, y: yPosition, size: 12, font: boldFont });
      yPosition -= 20;
      page.drawLine({ start: { x: 50, y: yPosition }, end: { x: 550, y: yPosition } });
      yPosition -= 20;

      // بيانات التحاليل
      rows.forEach(row => {
        if (yPosition < 100) {
          page = pdfDoc.addPage([600, 800]);
          yPosition = 750;
        }
        page.drawText(row.test_name, { x: 50, y: yPosition, size: 12, font: font });
        page.drawText(row.count.toString(), { x: 250, y: yPosition, size: 12, font: font });
        page.drawText(`${row.total_revenue.toFixed(2)} ج.م`, { x: 400, y: yPosition, size: 12, font: font });
        yPosition -= 20;
      });

      const pdfBytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
      res.send(pdfBytes);

    } else if (format === 'excel') {
      // تصدير Excel
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('التقرير المالي');

      // العنوان
      worksheet.mergeCells('A1:D1');
      worksheet.getCell('A1').value = 'تقرير مالي - نظام إدارة المعامل';
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      // الفترة الزمنية
      worksheet.mergeCells('A2:D2');
      worksheet.getCell('A2').value = `الفترة: من ${start} إلى ${end}`;
      worksheet.getCell('A2').font = { size: 14 };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      // الإجماليات
      let totalRevenue = 0;
      let totalSamples = 0;
      rows.forEach(row => {
        totalRevenue += row.total_revenue || 0;
        totalSamples += row.count || 0;
      });

      worksheet.getCell('A4').value = 'إجمالي الإيرادات:';
      worksheet.getCell('B4').value = `${totalRevenue.toFixed(2)} ج.م`;
      worksheet.getCell('B4').font = { bold: true };

      worksheet.getCell('A5').value = 'إجمالي العينات:';
      worksheet.getCell('B5').value = totalSamples;
      worksheet.getCell('B5').font = { bold: true };

      // جدول التفاصيل
      worksheet.addRow([]);
      worksheet.addRow(['اسم التحليل', 'عدد العينات', 'الإيرادات', 'المتوسط']);
      worksheet.getRow(7).font = { bold: true };

      rows.forEach(row => {
        worksheet.addRow([
          row.test_name,
          row.count,
          `${row.total_revenue.toFixed(2)} ج.م`,
          `${(row.total_revenue / row.count).toFixed(2)} ج.م`
        ]);
      });

      // تنسيق الأعمدة
      worksheet.columns = [
        { width: 30 },
        { width: 15 },
        { width: 20 },
        { width: 20 }
      ];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
      await workbook.xlsx.write(res);
      res.end();

    } else {
      res.status(400).json({ error: 'صيغة التصدير غير مدعومة' });
    }

  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'فشل تصدير التقرير' });
  }
});

// GET /api/reports/operational — تقرير تشغيلي
router.get('/operational', auth, (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'يجب تحديد تاريخ البداية والنهاية' });
  }

  try {
    // 1. جلب ملخص التقرير
    const summarySql = `
      SELECT 
        COUNT(*) as total_samples,
        AVG(JULIANDAY(s.result_date) - JULIANDAY(s.collection_date)) * 24 as avg_turnaround_hours,
        CAST(SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) * 100 / COUNT(*) as completion_rate
      FROM samples s
      WHERE DATE(s.created_at) BETWEEN ? AND ?
    `;

    // 2. جلب أداء الفنيين
    const techniciansSql = `
      SELECT 
        u.full_name,
        COUNT(s.id) as samples_completed,
        AVG(JULIANDAY(s.result_date) - JULIANDAY(s.collection_date)) * 24 as avg_turnaround_hours,
        100.0 as completion_rate
      FROM samples s
      JOIN users u ON s.completed_by = u.id
      WHERE s.status = 'completed'
        AND DATE(s.result_date) BETWEEN ? AND ?
      GROUP BY u.id, u.full_name
      ORDER BY samples_completed DESC
    `;

    // 3. جلب التحاليل الأكثر طلبًا
    const popularTestsSql = `
      SELECT 
        t.name_ar as test_name,
        COUNT(s.id) as count
      FROM samples s
      JOIN tests t ON s.test_type_id = t.id
      WHERE DATE(s.created_at) BETWEEN ? AND ?
      GROUP BY t.id, t.name_ar
      ORDER BY count DESC
      LIMIT 10
    `;

    // تنفيذ الاستعلامات
    db.get(summarySql, [start, end], (err, summary) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'فشل جلب ملخص التقرير' });
      }

      db.all(techniciansSql, [start, end], (err, technicians) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'فشل جلب بيانات الفنيين' });
        }

        db.all(popularTestsSql, [start, end], (err, popularTests) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'فشل جلب التحاليل الأكثر طلبًا' });
          }

          res.json({
            summary: summary || {},
            technicians: technicians || [],
            popular_tests: popularTests || []
          });
        });
      });
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'فشل جلب التقرير التشغيلي' });
  }
});

// GET /api/reports/operational/export — تصدير التقرير التشغيلي
router.get('/operational/export', auth, async (req, res) => {
  const { format, start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'يجب تحديد تاريخ البداية والنهاية' });
  }

  try {
    // جلب البيانات
    const summarySql = `
      SELECT 
        COUNT(*) as total_samples,
        AVG(JULIANDAY(s.result_date) - JULIANDAY(s.collection_date)) * 24 as avg_turnaround_hours,
        CAST(SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) * 100 / COUNT(*) as completion_rate
      FROM samples s
      WHERE DATE(s.created_at) BETWEEN ? AND ?
    `;

    const techniciansSql = `
      SELECT 
        u.full_name,
        COUNT(s.id) as samples_completed,
        AVG(JULIANDAY(s.result_date) - JULIANDAY(s.collection_date)) * 24 as avg_turnaround_hours
      FROM samples s
      JOIN users u ON s.completed_by = u.id
      WHERE s.status = 'completed'
        AND DATE(s.result_date) BETWEEN ? AND ?
      GROUP BY u.id, u.full_name
      ORDER BY samples_completed DESC
    `;

    const popularTestsSql = `
      SELECT 
        t.name_ar as test_name,
        COUNT(s.id) as count
      FROM samples s
      JOIN tests t ON s.test_type_id = t.id
      WHERE DATE(s.created_at) BETWEEN ? AND ?
      GROUP BY t.id, t.name_ar
      ORDER BY count DESC
      LIMIT 10
    `;

    const summary = await new Promise((resolve, reject) => {
      db.get(summarySql, [start, end], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const technicians = await new Promise((resolve, reject) => {
      db.all(techniciansSql, [start, end], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const popularTests = await new Promise((resolve, reject) => {
      db.all(popularTestsSql, [start, end], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (format === 'pdf') {
      const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // العنوان
      page.drawText('تقرير تشغيلي - نظام إدارة المعامل', {
        x: 50,
        y: 750,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // الفترة الزمنية
      page.drawText(`الفترة: من ${start} إلى ${end}`, {
        x: 50,
        y: 720,
        size: 14,
        font: font,
        color: rgb(0, 0, 0),
      });

      // الإحصائيات الأساسية
      page.drawText('الإحصائيات الأساسية:', {
        x: 50,
        y: 690,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(`إجمالي العينات: ${summary.total_samples || 0}`, {
        x: 50,
        y: 670,
        size: 14,
        font: font,
        color: rgb(0, 0, 0),
      });
      page.drawText(`متوسط وقت التسليم: ${summary.avg_turnaround_hours ? summary.avg_turnaround_hours.toFixed(1) : 0} ساعة`, {
        x: 50,
        y: 650,
        size: 14,
        font: font,
        color: rgb(0, 0, 0),
      });
      page.drawText(`نسبة الإنجاز: ${summary.completion_rate ? summary.completion_rate.toFixed(1) : 0}%`, {
        x: 50,
        y: 630,
        size: 14,
        font: font,
        color: rgb(0, 0, 0),
      });

      // أداء الفنيين
      let yPosition = 600;
      page.drawText('أداء الفنيين:', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      if (technicians.length > 0) {
        technicians.forEach(tech => {
          if (yPosition < 100) {
            page = pdfDoc.addPage([600, 800]);
            yPosition = 750;
          }
          page.drawText(`${tech.full_name}: ${tech.samples_completed} عينة, متوسط الوقت: ${tech.avg_turnaround_hours ? tech.avg_turnaround_hours.toFixed(1) : 0} ساعة`, {
            x: 50,
            y: yPosition,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPosition -= 20;
        });
      } else {
        page.drawText('لا توجد بيانات لأداء الفنيين', {
          x: 50,
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      // التحاليل الأكثر طلبًا
      yPosition -= 40;
      page.drawText('التحاليل الأكثر طلبًا:', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      if (popularTests.length > 0) {
        popularTests.forEach(test => {
          if (yPosition < 100) {
            page = pdfDoc.addPage([600, 800]);
            yPosition = 750;
          }
          page.drawText(`${test.test_name}: ${test.count} عينة`, {
            x: 50,
            y: yPosition,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPosition -= 20;
        });
      } else {
        page.drawText('لا توجد بيانات للتحاليل الأكثر طلبًا', {
          x: 50,
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      const pdfBytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="operational_report.pdf"');
      res.send(pdfBytes);

    } else if (format === 'excel') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('التقرير التشغيلي');

      // العنوان
      worksheet.mergeCells('A1:D1');
      worksheet.getCell('A1').value = 'تقرير تشغيلي - نظام إدارة المعامل';
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      // الفترة الزمنية
      worksheet.mergeCells('A2:D2');
      worksheet.getCell('A2').value = `الفترة: من ${start} إلى ${end}`;
      worksheet.getCell('A2').font = { size: 14 };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      // الإحصائيات الأساسية
      worksheet.addRow([]);
      worksheet.addRow(['الإحصائيات الأساسية:', '', '', '']);
      worksheet.addRow(['إجمالي العينات:', summary.total_samples || 0, '', '']);
      worksheet.addRow(['متوسط وقت التسليم (ساعة):', summary.avg_turnaround_hours ? summary.avg_turnaround_hours.toFixed(1) : 0, '', '']);
      worksheet.addRow(['نسبة الإنجاز:', `${summary.completion_rate ? summary.completion_rate.toFixed(1) : 0}%`, '', '']);

      // أداء الفنيين
      worksheet.addRow([]);
      worksheet.addRow(['أداء الفنيين:', '', '', '']);
      worksheet.addRow(['اسم الفني', 'عدد العينات', 'متوسط وقت التسليم (ساعة)', '']);
      
      technicians.forEach(tech => {
        worksheet.addRow([
          tech.full_name,
          tech.samples_completed,
          tech.avg_turnaround_hours ? tech.avg_turnaround_hours.toFixed(1) : 0,
          ''
        ]);
      });

      // التحاليل الأكثر طلبًا
      worksheet.addRow([]);
      worksheet.addRow(['التحاليل الأكثر طلبًا:', '', '', '']);
      worksheet.addRow(['اسم التحليل', 'عدد العينات', '', '']);
      
      popularTests.forEach(test => {
        worksheet.addRow([
          test.test_name,
          test.count,
          '',
          ''
        ]);
      });

      // تنسيق الأعمدة
      worksheet.columns = [
        { width: 30 },
        { width: 15 },
        { width: 25 },
        { width: 10 }
      ];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="operational_report.xlsx"');
      await workbook.xlsx.write(res);
      res.end();

    } else {
      res.status(400).json({ error: 'صيغة التصدير غير مدعومة' });
    }

  } catch (error) {
    console.error('Error exporting operational report:', error);
    res.status(500).json({ error: 'فشل تصدير التقرير التشغيلي' });
  }
});
module.exports = router;