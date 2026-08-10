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

// Fallback memory data for local development when MongoDB is unavailable
const getMemoryStore = () => {
  const store = global.memoryStore || {};
  return {
    patients: store.patients || [],
    doctors: store.doctors || [],
    appointments: store.appointments || [],
    invoices: store.invoices || [],
    medicines: store.medicines || []
  };
};

const filterByDateRange = (items, field, startDate, endDate) => {
  if (!startDate || !endDate) return items;
  return items.filter(item => item[field] >= startDate && item[field] <= endDate);
};

const groupBy = (items, keyFn, valueFn = () => 1) => {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + valueFn(item);
    return acc;
  }, {});
};

// Auth middleware - Only Admin can access reports
const adminProtect = [protect, authorize('Admin')];

// @desc    Get dashboard summary statistics
// @route   GET /api/reports/dashboard
// @access  Private/Admin
router.get('/dashboard', adminProtect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!checkDB()) {
      const store = getMemoryStore();
      const todayAppointments = filterByDateRange(store.appointments, 'date', startDate, endDate);
      const unpaidInvoices = store.invoices.filter(i => i.status === 'Unpaid');
      const todayPaidInvoices = filterByDateRange(store.invoices.filter(i => i.status === 'Paid'), 'date', startDate, endDate);
      const lowStockCount = store.medicines.filter(m => m.stockQuantity <= m.lowStockThreshold).length;

      const invoiceRevToday = todayPaidInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
      const apptRevToday = todayAppointments
        .filter(a => a.status === 'Scheduled' || a.status === 'Completed')
        .reduce((sum, a) => sum + (a.fee || 0), 0);

      return res.json({
        success: true,
        data: {
          totalPatients: store.patients.length,
          totalDoctors: store.doctors.length,
          todayAppointments: todayAppointments.length,
          todayRevenue: invoiceRevToday + apptRevToday,
          pendingBills: unpaidInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0),
          lowStockMedicines: lowStockCount
        }
      });
    }

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
    const { startDate, endDate } = req.query;

    if (!checkDB()) {
      const store = getMemoryStore();
      const currentYear = new Date().getFullYear().toString();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const monthlyCounts = store.patients
        .filter(p => p.registeredDate?.startsWith(currentYear))
        .reduce((acc, p) => {
          const month = p.registeredDate?.slice(5, 7);
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

      const formattedMonthly = months.map((month, index) => {
        const monthNum = (index + 1).toString().padStart(2, '0');
        return { month, patients: monthlyCounts[monthNum] || 0 };
      });

      const genderStats = Object.entries(
        store.patients.reduce((acc, p) => {
          const gender = p.gender || 'Unknown';
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }));

      const patientsList = filterByDateRange(store.patients, 'registeredDate', startDate, endDate)
        .sort((a, b) => (b.registeredDate || '').localeCompare(a.registeredDate || ''))
        .slice(0, 100);

      return res.json({
        success: true,
        data: {
          monthlyRegistrations: formattedMonthly,
          genderDistribution: genderStats,
          list: patientsList
        }
      });
    }

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
    const { startDate, endDate, status, doctorId } = req.query;

    if (!checkDB()) {
      const store = getMemoryStore();
      let appointments = filterByDateRange(store.appointments, 'date', startDate, endDate);
      if (status && status !== 'All') {
        appointments = appointments.filter(a => a.status === status);
      }
      if (doctorId && doctorId !== 'All') {
        appointments = appointments.filter(a => a.doctorId === doctorId);
      }

      const statusDist = Object.entries(groupBy(appointments, a => a.status))
        .map(([name, value]) => ({ name, value }));

      const appointmentsList = appointments.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 100);

      return res.json({
        success: true,
        data: {
          statusDistribution: statusDist,
          list: appointmentsList
        }
      });
    }
    
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
    const currentYear = new Date().getFullYear().toString();
    const { startDate, endDate } = req.query;

    if (!checkDB()) {
      const store = getMemoryStore();
      const invoices = filterByDateRange(store.invoices, 'date', startDate, endDate).filter(i => i.status === 'Paid');
      const appts = filterByDateRange(store.appointments, 'date', startDate, endDate).filter(a => ['Scheduled', 'Completed'].includes(a.status));

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const invoiceByMonth = invoices.reduce((acc, invoice) => {
        const month = invoice.date?.slice(5, 7);
        acc[month] = (acc[month] || 0) + (invoice.totalAmount || 0);
        return acc;
      }, {});
      const apptByMonth = appts.reduce((acc, appt) => {
        const month = appt.date?.slice(5, 7);
        acc[month] = (acc[month] || 0) + (appt.fee || 0);
        return acc;
      }, {});

      const formattedRevenue = months.map((month, index) => {
        const monthNum = (index + 1).toString().padStart(2, '0');
        const invRev = invoiceByMonth[monthNum] || 0;
        const apptRev = apptByMonth[monthNum] || 0;
        return { month, revenue: invRev + apptRev, invoices: invRev, appointments: apptRev };
      });

      const invoiceList = filterByDateRange(store.invoices, 'date', startDate, endDate)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 100);

      return res.json({
        success: true,
        data: {
          monthlyRevenue: formattedRevenue,
          list: invoiceList
        }
      });
    }

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
    if (!checkDB()) {
      const store = getMemoryStore();
      const totalValue = store.medicines.reduce((sum, med) => sum + ((med.stockQuantity || 0) * (med.sellingPrice || 0)), 0);
      const totalItems = store.medicines.length;
      const totalStock = store.medicines.reduce((sum, med) => sum + (med.stockQuantity || 0), 0);
      const categoryDist = Object.entries(groupBy(store.medicines, m => m.category)).map(([name, value]) => ({ name, value }));
      const lowStockList = store.medicines.filter(m => m.stockQuantity <= m.lowStockThreshold).sort((a, b) => (a.stockQuantity || 0) - (b.stockQuantity || 0));

      return res.json({
        success: true,
        data: {
          stats: { totalValue, totalItems, totalStock },
          categories: categoryDist,
          lowStock: lowStockList,
          list: lowStockList
        }
      });
    }
    
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
    const { department } = req.query;

    if (!checkDB()) {
      const store = getMemoryStore();
      const filteredAppointments = store.appointments.filter(a => ['Scheduled', 'Completed'].includes(a.status));
      const doctorPerf = Object.values(filteredAppointments.reduce((acc, appt) => {
        const id = appt.doctorId || 'unknown';
        if (!acc[id]) {
          acc[id] = { id, name: appt.doctorName, appointments: 0, revenue: 0 };
        }
        acc[id].appointments += 1;
        acc[id].revenue += appt.fee || 0;
        return acc;
      }, {}));

      const topDoctors = doctorPerf.sort((a, b) => b.appointments - a.appointments).slice(0, 10);
      const doctorsList = store.doctors
        .filter(doc => !department || department === 'All' || doc.specialty === department)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));

      return res.json({
        success: true,
        data: {
          topDoctors,
          list: doctorsList
        }
      });
    }

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
