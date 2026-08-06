const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const Medicine = require('../models/Medicine');
const { protect, authorize } = require('../middleware/auth');

// Helper to check if DB is connected
const checkDB = () => mongoose.connection.readyState === 1;

// Auth middleware - Only Admin can access reports
const adminProtect = [protect, authorize('Admin')];

// @desc    Get dashboard summary statistics
// @route   GET /api/reports/dashboard
// @access  Private/Admin
router.get('/dashboard', adminProtect, async (req, res) => {
  try {
    if (!checkDB()) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }

    const { startDate, endDate } = req.query;
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.date = { $gte: startDate, $lte: endDate };
    }

    const [
      totalPatients,
      totalDoctors,
      todayAppointments,
      unpaidInvoices,
      todayInvoices,
      lowStockCount
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.find(matchStage).lean(),
      Invoice.aggregate([
        { $match: { status: 'Unpaid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Invoice.aggregate([
        { $match: { ...matchStage, status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Medicine.aggregate([
        { $project: { isLowStock: { $lte: ['$stockQuantity', '$lowStockThreshold'] } } },
        { $match: { isLowStock: true } },
        { $count: 'count' }
      ])
    ]);

    const pendingBills = unpaidInvoices.length > 0 ? unpaidInvoices[0].total : 0;
    
    // Revenue = Paid invoices + Scheduled/Completed appointments
    const invoiceRevToday = todayInvoices.length > 0 ? todayInvoices[0].total : 0;
    const apptRevToday = todayAppointments
      .filter(a => a.status === 'Scheduled' || a.status === 'Completed')
      .reduce((sum, a) => sum + (a.fee || 0), 0);
    
    const todayRevenue = invoiceRevToday + apptRevToday;
    const lowStockMedicines = lowStockCount.length > 0 ? lowStockCount[0].count : 0;

    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        todayAppointments: todayAppointments.length,
        todayRevenue,
        pendingBills,
        lowStockMedicines
      }
    });

  } catch (error) {
    console.error('Dashboard report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate dashboard report' });
  }
});

// @desc    Get patient reports & monthly registrations
// @route   GET /api/reports/patients
// @access  Private/Admin
router.get('/patients', adminProtect, async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database not available' });

    const { startDate, endDate } = req.query;
    
    // Monthly registrations for current year
    const currentYear = new Date().getFullYear().toString();
    
    const monthlyData = await Patient.aggregate([
      { $match: { registeredDate: { $regex: `^${currentYear}` } } },
      { 
        $group: { 
          _id: { $substr: ["$registeredDate", 5, 2] }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthly = months.map((month, index) => {
      const monthNum = (index + 1).toString().padStart(2, '0');
      const found = monthlyData.find(d => d._id === monthNum);
      return { month, patients: found ? found.count : 0 };
    });

    const genderStats = await Patient.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]);

    let matchStage = {};
    if (startDate && endDate) {
      matchStage.registeredDate = { $gte: startDate, $lte: endDate };
    }

    const patientsList = await Patient.find(matchStage).sort({ registeredDate: -1 }).limit(100);

    res.json({
      success: true,
      data: {
        monthlyRegistrations: formattedMonthly,
        genderDistribution: genderStats.map(g => ({ name: g._id, value: g.count })),
        list: patientsList
      }
    });

  } catch (error) {
    console.error('Patient report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate patient report' });
  }
});

// @desc    Get appointments report
// @route   GET /api/reports/appointments
// @access  Private/Admin
router.get('/appointments', adminProtect, async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database not available' });
    
    const { startDate, endDate, status, doctorId } = req.query;
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.date = { $gte: startDate, $lte: endDate };
    }
    if (status && status !== 'All') {
      matchStage.status = status;
    }
    if (doctorId && doctorId !== 'All') {
      matchStage.doctorId = doctorId;
    }

    const statusDist = await Appointment.aggregate([
      { $match: matchStage },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const appointmentsList = await Appointment.find(matchStage).sort({ date: -1 }).limit(100);

    res.json({
      success: true,
      data: {
        statusDistribution: statusDist.map(s => ({ name: s._id, value: s.count })),
        list: appointmentsList
      }
    });

  } catch (error) {
    console.error('Appointment report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate appointment report' });
  }
});

// @desc    Get revenue report
// @route   GET /api/reports/revenue
// @access  Private/Admin
router.get('/revenue', adminProtect, async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database not available' });
    
    const currentYear = new Date().getFullYear().toString();
    const { startDate, endDate } = req.query;
    
    let matchStageInvoice = { status: 'Paid' };
    let matchStageAppt = { status: { $in: ['Scheduled', 'Completed'] } };

    if (startDate && endDate) {
      matchStageInvoice.date = { $gte: startDate, $lte: endDate };
      matchStageAppt.date = { $gte: startDate, $lte: endDate };
    } else {
      matchStageInvoice.date = { $regex: `^${currentYear}` };
      matchStageAppt.date = { $regex: `^${currentYear}` };
    }
    
    const invoicesData = await Invoice.aggregate([
      { $match: matchStageInvoice },
      { 
        $group: { 
          _id: { $substr: ["$date", 5, 2] }, 
          revenue: { $sum: '$totalAmount' } 
        } 
      }
    ]);

    const apptsData = await Appointment.aggregate([
      { $match: matchStageAppt },
      { 
        $group: { 
          _id: { $substr: ["$date", 5, 2] }, 
          revenue: { $sum: '$fee' } 
        } 
      }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedRevenue = months.map((month, index) => {
      const monthNum = (index + 1).toString().padStart(2, '0');
      const invRev = invoicesData.find(d => d._id === monthNum)?.revenue || 0;
      const apptRev = apptsData.find(d => d._id === monthNum)?.revenue || 0;
      return { month, revenue: invRev + apptRev, invoices: invRev, appointments: apptRev };
    });

    let invoiceListMatch = {};
    if (startDate && endDate) {
      invoiceListMatch.date = { $gte: startDate, $lte: endDate };
    }
    const invoiceList = await Invoice.find(invoiceListMatch).sort({ date: -1 }).limit(100);

    res.json({
      success: true,
      data: {
        monthlyRevenue: formattedRevenue,
        list: invoiceList
      }
    });

  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate revenue report' });
  }
});

// @desc    Get pharmacy/inventory report
// @route   GET /api/reports/pharmacy
// @access  Private/Admin
router.get('/pharmacy', adminProtect, async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database not available' });
    
    const inventoryStats = await Medicine.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$sellingPrice'] } },
          totalItems: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' }
        }
      }
    ]);

    const categoryDist = await Medicine.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const lowStockList = await Medicine.aggregate([
      { $project: { id: 1, name: 1, category: 1, stockQuantity: 1, lowStockThreshold: 1, sellingPrice: 1, isLowStock: { $lte: ['$stockQuantity', '$lowStockThreshold'] } } },
      { $match: { isLowStock: true } },
      { $sort: { stockQuantity: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: inventoryStats[0] || { totalValue: 0, totalItems: 0, totalStock: 0 },
        categories: categoryDist.map(c => ({ name: c._id, value: c.count })),
        lowStock: lowStockList,
        list: lowStockList
      }
    });

  } catch (error) {
    console.error('Pharmacy report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate pharmacy report' });
  }
});

// @desc    Get doctor performance report
// @route   GET /api/reports/doctors
// @access  Private/Admin
router.get('/doctors', adminProtect, async (req, res) => {
  try {
    if (!checkDB()) return res.status(503).json({ success: false, error: 'Database not available' });

    const { department } = req.query;

    const topDoctors = await Appointment.aggregate([
      { $match: { status: { $in: ['Scheduled', 'Completed'] } } },
      { $group: { _id: "$doctorId", name: { $first: "$doctorName" }, appointments: { $sum: 1 }, revenue: { $sum: "$fee" } } },
      { $sort: { appointments: -1 } },
      { $limit: 10 }
    ]);

    let matchStage = {};
    if (department && department !== 'All') {
      matchStage.specialty = department;
    }

    const doctorsList = await Doctor.find(matchStage).sort({ rating: -1, consultsCount: -1 });

    res.json({
      success: true,
      data: {
        topDoctors: topDoctors.map(d => ({ name: d.name, appointments: d.appointments, revenue: d.revenue })),
        list: doctorsList
      }
    });

  } catch (error) {
    console.error('Doctor report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate doctor report' });
  }
});

module.exports = router;
