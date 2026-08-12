const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

// Load environment and memory store
require('dotenv').config();
require('../config/memoryStore');

describe('Subhan Care HMS — Integration & API Test Suite', () => {
  let server;
  let baseUrl;
  let adminToken;
  let patientToken;

  before(async () => {
    const express = require('express');
    const cors = require('cors');

    const app = express();
    app.use(cors());
    app.use(express.json());

    // API Routes
    app.use('/api/auth', require('../routes/auth'));
    app.use('/api/patients', require('../routes/patients'));
    app.use('/api/doctors', require('../routes/doctors'));
    app.use('/api/staff', require('../routes/staff'));
    app.use('/api/appointments', require('../routes/appointments'));
    app.use('/api/invoices', require('../routes/invoices'));
    app.use('/api/inventory', require('../routes/inventory'));
    app.use('/api/reports', require('../routes/reports'));
    app.use('/api/search', require('../routes/search'));
    app.use('/api/medical-records', require('../routes/medicalRecords'));
    app.use('/api/prescriptions', require('../routes/prescriptions'));

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  // Helper HTTP request runner
  const request = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(baseUrl + path);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  // 1. AUTHENTICATION TESTS
  describe('Auth Endpoints', () => {
    test('POST /api/auth/login — Admin Login Success', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'admin@subhancare.com',
        password: 'admin123'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);
      assert.equal(res.body.user.role, 'Admin');
      adminToken = res.body.token;
    });

    test('POST /api/auth/login — Patient Login Success', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'patient@subhancare.com',
        password: 'patient123'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);
      assert.equal(res.body.user.role, 'Patient');
      patientToken = res.body.token;
    });

    test('POST /api/auth/login — Reject Invalid Credentials', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'admin@subhancare.com',
        password: 'wrongpassword'
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    test('POST /api/auth/send-login-otp — Generate OTP', async () => {
      const res = await request('POST', '/auth/send-login-otp', {
        email: 'admin@subhancare.com'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test('POST /api/auth/verify-login-otp — Master OTP Verification', async () => {
      const res = await request('POST', '/auth/verify-login-otp', {
        email: 'admin@subhancare.com',
        otp: '123456'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  // 2. PATIENT REGISTRY TESTS
  describe('Patient Management', () => {
    test('GET /api/patients — Authorized Fetch Patients', async () => {
      const res = await request('GET', '/patients', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    test('GET /api/patients — Reject Unauthenticated Request', async () => {
      const res = await request('GET', '/patients');
      assert.equal(res.status, 401);
    });

    test('POST /api/patients — Add New Patient', async () => {
      const newPat = {
        name: 'Test Patient',
        email: 'testpatient@gmail.com',
        phone: '+1 (555) 999-8888',
        gender: 'Male',
        cnic: '35201-9999999-9',
        bloodGroup: 'B+',
        address: '100 Test St',
        emergencyContact: 'Jane (+1 555-000-1111)',
        allergies: 'None',
        allergySeverity: 'None',
        registeredDate: '2026-08-01'
      };
      const res = await request('POST', '/patients', newPat, adminToken);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.id);
    });
  });

  // 3. DOCTORS ROSTER TESTS
  describe('Doctor Roster', () => {
    test('GET /api/doctors — Fetch Doctors Roster', async () => {
      const res = await request('GET', '/doctors', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length > 0);
    });
  });

  // 4. APPOINTMENT SCHEDULING TESTS
  describe('Appointments', () => {
    test('GET /api/appointments — Fetch Appointments', async () => {
      const res = await request('GET', '/appointments', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test('GET /api/appointments/available-slots — Check Slot Availability', async () => {
      const res = await request('GET', '/appointments/available-slots?doctorId=doc-1&date=2026-08-10', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.availableSlots));
    });
  });

  // 5. INVOICING & BILLING TESTS
  describe('Invoices', () => {
    let testInvoiceId;

    test('GET /api/invoices — Fetch Invoices', async () => {
      const res = await request('GET', '/invoices', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test('POST /api/invoices — Create New Invoice', async () => {
      const invData = {
        patientId: 'SC-PAT-10001',
        date: '2026-08-01',
        dueDate: '2026-08-08',
        paymentMethod: 'Card',
        services: [{ name: 'Consultation Fee', cost: 150 }],
        taxRate: 10,
        discount: 5
      };
      const res = await request('POST', '/invoices', invData, adminToken);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.id);
      testInvoiceId = res.body.data.id;
    });

    test('PUT /api/invoices/:id/pay — Mark Invoice Paid', async () => {
      if (!testInvoiceId) return;
      const res = await request('PUT', `/invoices/${testInvoiceId}/pay`, null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'Paid');
    });
  });

  // 6. PHARMACY INVENTORY TESTS
  describe('Pharmacy Inventory', () => {
    let testMedId;

    test('GET /api/inventory — Fetch Inventory', async () => {
      const res = await request('GET', '/inventory', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length > 0);
    });

    test('GET /api/inventory/low-stock — Fetch Low Stock Alerts', async () => {
      const res = await request('GET', '/inventory/low-stock', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test('POST /api/inventory — Create Medicine Item', async () => {
      const medData = {
        name: 'Ibuprofen 400mg',
        genericName: 'Ibuprofen',
        category: 'Tablet',
        expiryDate: '2027-12-31',
        purchasePrice: 0.10,
        sellingPrice: 0.30,
        stockQuantity: 100,
        lowStockThreshold: 20
      };
      const res = await request('POST', '/inventory', medData, adminToken);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.id);
      testMedId = res.body.data.id;
    });

    test('PUT /api/inventory/:id/stock — Adjust Stock', async () => {
      if (!testMedId) return;
      const res = await request('PUT', `/inventory/${testMedId}/stock`, { adjustment: 50, reason: 'Restock' }, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  // 7. MEDICAL RECORDS TESTS
  describe('Medical Records', () => {
    let testRecordId;

    test('POST /api/medical-records — Create Medical Record', async () => {
      const recData = {
        patientId: 'SC-PAT-10001',
        recordType: 'Diagnosis',
        recordDate: '2026-08-05',
        title: 'Acute Bronchitis Evaluation',
        description: 'Patient presented with persistent cough and low fever.',
        findings: 'Bilateral rhonchi noted',
        recommendations: 'Hydration and rest',
        severity: 'Medium'
      };
      const res = await request('POST', '/medical-records', recData, adminToken);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.recordId);
      testRecordId = res.body.data.recordId;
    });

    test('POST /api/medical-records — Duplicate Prevention Check', async () => {
      const recData = {
        patientId: 'SC-PAT-10001',
        recordType: 'Diagnosis',
        recordDate: '2026-08-05',
        title: 'Acute Bronchitis Evaluation',
        description: 'Patient presented with persistent cough and low fever.',
        severity: 'Medium'
      };
      const res = await request('POST', '/medical-records', recData, adminToken);
      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
    });

    test('GET /api/medical-records — Fetch All Records', async () => {
      const res = await request('GET', '/medical-records', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length > 0);
    });

    test('GET /api/medical-records/patient/:id/timeline — Fetch Patient Timeline', async () => {
      const res = await request('GET', '/medical-records/patient/SC-PAT-10001/timeline', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length > 0);
    });

    test('GET /api/medical-records/patient/:id/summary — Fetch Patient Summary', async () => {
      const res = await request('GET', '/medical-records/patient/SC-PAT-10001/summary', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.severityBreakdown);
    });

    test('PUT /api/medical-records/:id — Update Medical Record', async () => {
      if (!testRecordId) return;
      const res = await request('PUT', `/medical-records/${testRecordId}`, { status: 'Resolved' }, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'Resolved');
    });

    test('DELETE /api/medical-records/:id — Delete Medical Record', async () => {
      if (!testRecordId) return;
      const res = await request('DELETE', `/medical-records/${testRecordId}`, null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  // 8. PRESCRIPTIONS TESTS
  describe('Prescriptions', () => {
    let testRxId;

    test('POST /api/prescriptions — Create Prescription', async () => {
      const data = {
        patientId: 'SC-PAT-10001', patientName: 'Alice Johnson',
        doctorId: 'doc-1', doctorName: 'Dr. Sarah Connor',
        diagnosis: 'Acute Sinusitis with nasal congestion',
        medications: [
          { name: 'Amoxicillin', dosage: '500mg', frequency: 'Thrice daily', duration: 7, instructions: 'Take after meals' }
        ],
        issuedDate: '2026-08-05', expiryDate: '2026-09-05',
        refillsAllowed: 1, notes: 'Avoid dairy products'
      };
      const res = await request('POST', '/prescriptions', data, adminToken);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.prescriptionId);
      testRxId = res.body.data.prescriptionId;
    });

    test('GET /api/prescriptions — Fetch All Prescriptions', async () => {
      const res = await request('GET', '/prescriptions', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length > 0);
    });

    test('GET /api/prescriptions?patientId=SC-PAT-10001 — Filter by Patient', async () => {
      const res = await request('GET', '/prescriptions?patientId=SC-PAT-10001', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test('GET /api/prescriptions/:id — Fetch Single Prescription', async () => {
      if (!testRxId) return;
      const res = await request('GET', `/prescriptions/${testRxId}`, null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.prescriptionId, testRxId);
    });

    test('GET /api/prescriptions/:id/refill-status — Check Refill Eligibility', async () => {
      if (!testRxId) return;
      const res = await request('GET', `/prescriptions/${testRxId}/refill-status`, null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(typeof res.body.data.canRefill === 'boolean');
      assert.ok(typeof res.body.data.refillsRemaining === 'number');
    });

    test('POST /api/prescriptions/:id/refill — Refill Prescription', async () => {
      if (!testRxId) return;
      const res = await request('POST', `/prescriptions/${testRxId}/refill`, {}, adminToken);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.prescriptionId);
      assert.equal(res.body.data.parentPrescriptionId, testRxId);
    });

    test('PUT /api/prescriptions/:id — Update Prescription', async () => {
      if (!testRxId) return;
      const res = await request('PUT', `/prescriptions/${testRxId}`, { notes: 'Updated notes — rest and hydrate' }, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test('DELETE /api/prescriptions/:id — Soft-Cancel Prescription', async () => {
      if (!testRxId) return;
      const res = await request('DELETE', `/prescriptions/${testRxId}`, null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'Cancelled');
    });
  });

  // 9. REPORTS & SEARCH TESTS
  describe('Reports & Search', () => {
    test('GET /api/reports/generate?type=patients — Generate HTML/PDF Report', async () => {
      const res = await request('GET', '/reports/generate?type=patients', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.html.includes('Subhan Care Hospitals'));
    });

    test('GET /api/search?q=Alice — Full Text Search', async () => {
      const res = await request('GET', '/search?q=Alice', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  // 10. STAFF ENDPOINTS
  describe('Staff Endpoints', () => {
    let createdStaffId;

    test('GET /api/staff — Admin can list staff', async () => {
      const res = await request('GET', '/staff', null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    test('POST /api/staff — Admin can create new staff member and user', async () => {
      const newStaff = {
        name: 'Test Receptionist',
        email: 'test.receptionist@subhancare.com',
        phone: '+1 (555) 999-8888',
        role: 'Receptionist',
        department: 'Front Desk',
        shift: 'Evening',
        salary: 3200,
        password: 'Password123!'
      };
      const res = await request('POST', '/staff', newStaff, adminToken);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.id);
      assert.equal(res.body.data.name, 'Test Receptionist');
      createdStaffId = res.body.data.id;
    });

    test('PUT /api/staff/:id — Admin can update staff member', async () => {
      if (!createdStaffId) return;
      const updateData = {
        name: 'Test Receptionist Updated',
        department: 'Information Desk',
        salary: 3600
      };
      const res = await request('PUT', `/staff/${createdStaffId}`, updateData, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, 'Test Receptionist Updated');
      assert.equal(res.body.data.department, 'Information Desk');
    });

    test('DELETE /api/staff/:id — Admin can delete staff member and associated user', async () => {
      if (!createdStaffId) return;
      const res = await request('DELETE', `/staff/${createdStaffId}`, null, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });
});
