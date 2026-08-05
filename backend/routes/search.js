const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const { protect } = require('../middleware/auth');

// @desc    Full-text search across all collections
// @route   GET /api/search?q=keyword&type=patients|doctors|appointments|invoices&startDate=&endDate=&status=
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { q, type = 'patients', startDate, endDate, status, page = 1, limit = 50 } = req.query;
    const searchTerm = (q || '').trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const lim = Math.min(parseInt(limit), 100);

    let results = [];
    let total = 0;

    if (mongoose.connection.readyState === 1) {
      // ── MongoDB Full-Text Search ──────────────────────────────────────
      let filter = {};

      // Use $text search if keyword is provided, otherwise regex fallback
      if (searchTerm) {
        // Try $text first for multi-word, then fallback to regex for partial matches
        const regexPattern = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        switch (type.toLowerCase()) {
          case 'patients':
            filter = {
              $or: [
                { name: regexPattern },
                { email: regexPattern },
                { phone: regexPattern },
                { cnic: regexPattern },
                { id: regexPattern },
                { address: regexPattern },
                { bloodGroup: regexPattern }
              ]
            };
            break;
          case 'doctors':
            filter = {
              $or: [
                { name: regexPattern },
                { specialty: regexPattern },
                { email: regexPattern },
                { id: regexPattern }
              ]
            };
            break;
          case 'appointments':
            filter = {
              $or: [
                { patientName: regexPattern },
                { doctorName: regexPattern },
                { id: regexPattern }
              ]
            };
            break;
          case 'invoices':
            filter = {
              $or: [
                { patientName: regexPattern },
                { id: regexPattern },
                { patientId: regexPattern }
              ]
            };
            break;
        }
      }

      // Date range filter
      if (startDate && endDate) {
        filter.date = filter.date || {};
        filter.$and = filter.$and || [];
        filter.$and.push({ date: { $gte: startDate } });
        filter.$and.push({ date: { $lte: endDate } });
      } else if (startDate) {
        filter.date = { $gte: startDate };
      } else if (endDate) {
        filter.date = { $lte: endDate };
      }

      // For patients, use registeredDate instead of date
      if (type.toLowerCase() === 'patients' && (startDate || endDate)) {
        delete filter.date;
        if (filter.$and) {
          filter.$and = filter.$and.map(cond => {
            if (cond.date) return { registeredDate: cond.date };
            return cond;
          });
        } else if (startDate && endDate) {
          filter.$and = [
            { registeredDate: { $gte: startDate } },
            { registeredDate: { $lte: endDate } }
          ];
        } else if (startDate) {
          filter.registeredDate = { $gte: startDate };
        } else {
          filter.registeredDate = { $lte: endDate };
        }
      }

      // Status filter (appointments, invoices)
      if (status && status !== 'All') {
        filter.status = status;
      }

      // Execute query
      let Model;
      switch (type.toLowerCase()) {
        case 'patients':    Model = Patient; break;
        case 'doctors':     Model = Doctor; break;
        case 'appointments': Model = Appointment; break;
        case 'invoices':    Model = Invoice; break;
        default:            Model = Patient;
      }

      total = await Model.countDocuments(filter);
      results = await Model.find(filter).skip(skip).limit(lim).sort({ _id: -1 });

    } else {
      // ── Memory Store Fallback ────────────────────────────────────────
      const store = global.memoryStore;
      let data = [];
      const key = searchTerm.toLowerCase();

      switch (type.toLowerCase()) {
        case 'patients':
          data = store.patients.filter(p => {
            const matchesKey = !key ||
              p.name.toLowerCase().includes(key) ||
              p.email.toLowerCase().includes(key) ||
              p.phone.includes(key) ||
              p.id.toLowerCase().includes(key) ||
              (p.cnic && p.cnic.includes(key)) ||
              (p.address && p.address.toLowerCase().includes(key));
            const matchesDate = !startDate || !endDate ||
              (p.registeredDate >= startDate && p.registeredDate <= endDate);
            return matchesKey && matchesDate;
          });
          break;
        case 'doctors':
          data = store.doctors.filter(d => {
            return !key ||
              d.name.toLowerCase().includes(key) ||
              d.specialty.toLowerCase().includes(key) ||
              d.email.toLowerCase().includes(key) ||
              d.id.toLowerCase().includes(key);
          });
          break;
        case 'appointments':
          data = store.appointments.filter(a => {
            const matchesKey = !key ||
              a.patientName.toLowerCase().includes(key) ||
              a.doctorName.toLowerCase().includes(key) ||
              a.id.toLowerCase().includes(key);
            const matchesDate = !startDate || !endDate ||
              (a.date >= startDate && a.date <= endDate);
            const matchesStatus = !status || status === 'All' || a.status === status;
            return matchesKey && matchesDate && matchesStatus;
          });
          break;
        case 'invoices':
          data = store.invoices.filter(i => {
            const matchesKey = !key ||
              i.patientName.toLowerCase().includes(key) ||
              i.id.toLowerCase().includes(key);
            const matchesDate = !startDate || !endDate ||
              (i.date >= startDate && i.date <= endDate);
            const matchesStatus = !status || status === 'All' || i.status === status;
            return matchesKey && matchesDate && matchesStatus;
          });
          break;
      }

      total = data.length;
      results = data.slice(skip, skip + lim);
    }

    res.json({
      success: true,
      count: results.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / lim),
      data: results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
