const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Report = require('../models/Report');
const User = require('../models/User');
const { authenticate, requireActiveUser, requireAdmin } = require('../middleware/auth');

// POST /api/reports - Create a new report
router.post('/', authenticate, requireActiveUser, async (req, res) => {
  try {
    const { title, description, category, related_post_id } = req.body;

    if (!title || !description || !category || !related_post_id) {
      return res.status(400).json({ error: 'Title, description, category, and related post ID are required' });
    }

    const reportId = uuidv4();
    const sender = await User.findById(req.user.uid).select('email').lean();

    if (!sender) {
      return res.status(404).json({ error: 'User not found' });
    }

    const report = new Report({
      report_id: reportId,
      reporter_id: req.user.uid,
      reporter_email: sender.email,
      title,
      description,
      category,
      related_post_id: related_post_id || null,
    });

    await report.save();

    res.status(201).json({
      report_id: report.report_id,
      status: report.status,
      created_at: report.created_at,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// GET /api/reports/my-reports - Get user's own reports
router.get('/my-reports', authenticate, async (req, res) => {
  try {
    const reports = await Report.find({
      reporter_id: req.user.uid,
    })
      .sort({ created_at: -1 })
      .lean();

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/admin/reports - Get all reports for admin
router.get(
  '/admin/reports',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { status, assigned_to } = req.query;
      let query = {};

      if (status) {
        query.status = status;
      }

      if (assigned_to) {
        query.assigned_admin_id = assigned_to;
      }

      const reports = await Report.find(query)
        .sort({ created_at: -1 })
        .lean();

      res.json(reports);
    } catch (error) {
      console.error('Error fetching admin reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }
);

// PATCH /api/admin/reports/:id - Update report status and assign
router.patch(
  '/admin/reports/:id',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { status, admin_notes, assigned_admin_id } = req.body;
      const report = await Report.findById(req.params.id);

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      if (status && ['open', 'in-progress', 'resolved', 'dismissed'].includes(status)) {
        report.status = status;
        if (status === 'resolved' || status === 'dismissed') {
          report.resolved_at = new Date().toISOString();
        }
      }

      if (admin_notes !== undefined) {
        report.admin_notes = admin_notes;
      }

      if (assigned_admin_id !== undefined) {
        report.assigned_admin_id = assigned_admin_id;
      }

      report.updated_at = new Date().toISOString();
      await report.save();

      res.json(report);
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  }
);

// POST /api/admin/reports/:id/respond - Admin responds to report
router.post(
  '/admin/reports/:id/respond',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { message_text } = req.body;
      const report = await Report.findById(req.params.id);

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      if (!message_text) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      // Get admin user for email
      const adminUser = await User.findById(req.user.uid).select('email').lean();
      // Update report status and response metadata
      if (report.status === 'open') {
        report.status = 'in-progress';
      }
      const responseAt = new Date().toISOString();
      const responseEntry = {
        text: message_text,
        at: responseAt,
        by: req.user.uid,
        by_email: adminUser.email,
      };
      report.last_response_at = responseAt;
      report.last_response_by = req.user.uid;
      report.last_response_text = message_text;
      report.response_history = [...(report.response_history || []), responseEntry];
      report.updated_at = new Date().toISOString();
      await report.save();

      res.json({
        delivery: 'reports-only',
        timestamp: responseAt,
      });
    } catch (error) {
      console.error('Error responding to report:', error);
      res.status(500).json({ error: 'Failed to respond to report' });
    }
  }
);

module.exports = router;
