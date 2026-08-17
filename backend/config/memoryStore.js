const bcrypt = require('bcryptjs');

const memoryStore = {
  users: [
    { id: 'u1', name: 'Subhan Administrator',  email: 'admin@subhancare.com',        passwordHash: bcrypt.hashSync('admin123', 10),        role: 'Admin',        doctorId: null, patientId: null },
    { id: 'u2', name: 'Dr. Sarah Connor',      email: 'doctor@subhancare.com',       passwordHash: bcrypt.hashSync('doctor123', 10),       role: 'Doctor',       doctorId: 'doc-1', patientId: null },
    { id: 'u3', name: 'Reception Staff',       email: 'receptionist@subhancare.com', passwordHash: bcrypt.hashSync('receptionist123', 10), role: 'Receptionist', doctorId: null, patientId: null },
    { id: 'u4', name: 'Billing Officer',       email: 'billing@subhancare.com',      passwordHash: bcrypt.hashSync('billing123', 10),      role: 'Billing',      doctorId: null, patientId: null },
    { id: 'u5', name: 'Alice Johnson (Patient)', email: 'patient@subhancare.com',     passwordHash: bcrypt.hashSync('patient123', 10),      role: 'Patient',      doctorId: null, patientId: 'SC-PAT-10001' },
    { id: 'u6', name: 'Alice Johnson',         email: 'alice.j@gmail.com',           passwordHash: bcrypt.hashSync('patient123', 10),      role: 'Patient',      doctorId: null, patientId: 'SC-PAT-10001' },
    { id: 'u7', name: 'Demo Patient',           email: 'abc@gmail.com',               passwordHash: bcrypt.hashSync('patient123', 10),      role: 'Patient',      doctorId: null, patientId: 'SC-PAT-10002' },
  ],
  doctors: [
    { id: 'doc-1', name: 'Dr. Sarah Connor',  specialty: 'Cardiology',       phone: '+1 (555) 019-2834', email: 'sarah.connor@subhancare.com',  availability: 'Mon - Fri (9 AM - 5 PM)',          fee: 150, rating: 4.9, consultsCount: 28 },
    { id: 'doc-2', name: 'Dr. John Smith',    specialty: 'Pediatrics',        phone: '+1 (555) 014-9283', email: 'john.smith@subhancare.com',    availability: 'Mon - Thu (10 AM - 4 PM)',          fee: 120, rating: 4.7, consultsCount: 34 },
    { id: 'doc-3', name: 'Dr. Emily Davis',   specialty: 'Neurology',         phone: '+1 (555) 017-3849', email: 'emily.davis@subhancare.com',   availability: 'Tue, Thu, Fri (8 AM - 2 PM)',      fee: 200, rating: 4.8, consultsCount: 19 },
    { id: 'doc-4', name: 'Dr. Robert Chen',   specialty: 'General Medicine',  phone: '+1 (555) 012-4758', email: 'robert.chen@subhancare.com',   availability: 'Mon - Sat (9 AM - 1 PM)',           fee: 100, rating: 4.5, consultsCount: 52 }
  ],
  staff: [
    { id: 'SC-STF-10001', userId: 'u3', name: 'Reception Staff', email: 'receptionist@subhancare.com', phone: '+1 (555) 019-1111', role: 'Receptionist', department: 'Front Desk', shift: 'Morning', salary: 3500, status: 'Active', joiningDate: '2026-01-15' },
    { id: 'SC-STF-10002', userId: 'u4', name: 'Billing Officer', email: 'billing@subhancare.com', phone: '+1 (555) 019-2222', role: 'Billing', department: 'Finance', shift: 'Morning', salary: 4000, status: 'Active', joiningDate: '2026-02-01' }
  ],
  patients: [
    { id: 'SC-PAT-10001', name: 'Alice Johnson',  dob: '1992-03-15', gender: 'Female', cnic: '35201-1234567-1', phone: '+1 (555) 015-3829', email: 'alice.j@gmail.com',     bloodGroup: 'O+',  emergencyContact: 'Bob Johnson (+1 555-111-0001)',  address: '123 Maple St, Springfield',    allergies: 'Penicillin, Peanuts', allergySeverity: 'Critical', registeredDate: '2026-07-02' },
    { id: 'SC-PAT-10002', name: 'Bob Smith',       dob: '1981-07-22', gender: 'Male',   cnic: '35202-9876543-2', phone: '+1 (555) 011-2834', email: 'bob.smith@yahoo.com',   bloodGroup: 'A-',  emergencyContact: 'Jane Smith (+1 555-222-0002)',   address: '456 Oak Rd, Riverdale',        allergies: 'Latex, Iodine',       allergySeverity: 'Moderate', registeredDate: '2026-06-15' },
    { id: 'SC-PAT-10003', name: 'Charlie Brown',   dob: '2014-11-05', gender: 'Male',   cnic: '35203-1122334-3', phone: '+1 (555) 018-9382', email: 'charlie.b@gmail.com',  bloodGroup: 'B+',  emergencyContact: 'Linda Brown (+1 555-333-0003)', address: '789 Pine Ave, Greendale',      allergies: 'Dust Mites, Pollen',   allergySeverity: 'Mild',     registeredDate: '2026-07-10' },
    { id: 'SC-PAT-10004', name: 'Diana Prince',    dob: '1998-06-30', gender: 'Female', cnic: '35204-5566778-4', phone: '+1 (555) 016-4839', email: 'diana.p@amazon.com',   bloodGroup: 'AB+', emergencyContact: 'Clark Prince (+1 555-444-0004)', address: '101 Amazon Way, Themyscira',   allergies: 'None',                 allergySeverity: 'None',     registeredDate: '2026-07-19' }
  ],
  appointments: [
    { id: 'apt-1', patientId: 'SC-PAT-10001', patientName: 'Alice Johnson',  doctorId: 'doc-1', doctorName: 'Dr. Sarah Connor',  date: '2026-07-25', time: '10:00', fee: 150, status: 'Scheduled' },
    { id: 'apt-2', patientId: 'SC-PAT-10002', patientName: 'Bob Smith',       doctorId: 'doc-4', doctorName: 'Dr. Robert Chen',   date: '2026-07-26', time: '11:30', fee: 100, status: 'Scheduled' },
    { id: 'apt-3', patientId: 'SC-PAT-10004', patientName: 'Diana Prince',    doctorId: 'doc-3', doctorName: 'Dr. Emily Davis',   date: '2026-07-27', time: '14:00', fee: 200, status: 'Cancelled' },
    { id: 'apt-4', patientId: 'SC-PAT-10003', patientName: 'Charlie Brown',   doctorId: 'doc-2', doctorName: 'Dr. John Smith',    date: '2026-07-28', time: '09:30', fee: 120, status: 'Scheduled' }
  ],
  settings: {
    hospital: {
      name: 'Subhan Care HMS',
      address: '123 Health Ave, Medical City',
      phone: '+1 (555) 123-4567',
      email: 'contact@subhancare.com',
      website: 'https://subhancare.com',
      emergencyContact: '911',
      currency: 'USD',
      timeZone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      logo: ''
    },
    system: {
      appointmentDuration: 30,
      openingHours: '09:00 - 17:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      language: 'English',
      theme: 'light'
    },
    security: {
      passwordPolicy: true,
      minPasswordLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false,
      maxLoginAttempts: 5,
      accountLockTime: 15
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      appointmentReminders: true,
      billingAlerts: true,
      stockAlerts: true
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      username: '',
      password: '',
      senderEmail: '',
      senderName: 'Subhan Care'
    },
    sms: {
      provider: 'None',
      twilioSid: '',
      twilioAuthToken: '',
      twilioPhone: '',
      customGatewayUrl: '',
      customGatewayKey: ''
    }
  },
  invoices: [
    { id: 'INV-1001', patientId: 'SC-PAT-10001', patientName: 'Alice Johnson', date: '2026-07-15', dueDate: '2026-07-22', paymentMethod: 'Card',          services: [{ name: 'General Cardiology Consultation', cost: 150 }, { name: 'Electrocardiogram (ECG)', cost: 80 }],       subtotal: 230,  taxRate: 8,  taxAmount: 18.4, totalAmount: 248.4, status: 'Paid' },
    { id: 'INV-1002', patientId: 'SC-PAT-10002', patientName: 'Bob Smith',      date: '2026-07-18', dueDate: '2026-07-25', paymentMethod: 'Cash',          services: [{ name: 'Physician Consultation', cost: 100 }, { name: 'Urinalysis & Lab Workup', cost: 45 }],              subtotal: 145,  taxRate: 5,  taxAmount: 7.25, totalAmount: 152.25, status: 'Unpaid' },
    { id: 'INV-1003', patientId: 'SC-PAT-10004', patientName: 'Diana Prince',   date: '2026-07-20', dueDate: '2026-07-27', paymentMethod: 'Bank Transfer',  services: [{ name: 'Neurology Consultation', cost: 200 }, { name: 'MRI Brain Scan', cost: 450 }],                    subtotal: 650,  taxRate: 10, taxAmount: 65,   totalAmount: 715,    status: 'Paid' }
  ],
  medicines: [
    { id: 'MED-1001', name: 'Paracetamol 500mg',    genericName: 'Acetaminophen',    category: 'Tablet',    manufacturer: 'PharmaCo',        batchNumber: 'BT-2024-001', expiryDate: '2026-12-31', purchasePrice: 0.05, sellingPrice: 0.15, stockQuantity: 500, lowStockThreshold: 50,  unit: 'Tablets',  location: 'Shelf A1', description: 'Pain reliever and fever reducer', createdAt: '2026-01-10T00:00:00.000Z' },
    { id: 'MED-1002', name: 'Amoxicillin 250mg',    genericName: 'Amoxicillin',      category: 'Capsule',   manufacturer: 'MedGen Labs',     batchNumber: 'BT-2024-002', expiryDate: '2026-09-30', purchasePrice: 0.20, sellingPrice: 0.60, stockQuantity: 8,   lowStockThreshold: 20,  unit: 'Capsules', location: 'Shelf B2', description: 'Broad-spectrum antibiotic', createdAt: '2026-01-15T00:00:00.000Z' },
    { id: 'MED-1003', name: 'Cough Syrup 100ml',    genericName: 'Dextromethorphan', category: 'Syrup',     manufacturer: 'HealthPlus',      batchNumber: 'BT-2024-003', expiryDate: '2027-03-31', purchasePrice: 1.50, sellingPrice: 4.50, stockQuantity: 45,  lowStockThreshold: 15,  unit: 'Bottles',  location: 'Shelf C3', description: 'Non-drowsy cough suppressant', createdAt: '2026-02-01T00:00:00.000Z' },
    { id: 'MED-1004', name: 'Insulin Glargine',     genericName: 'Insulin Glargine', category: 'Injection', manufacturer: 'DiabeCare Ltd',   batchNumber: 'BT-2024-004', expiryDate: '2026-07-15', purchasePrice: 8.00, sellingPrice: 20.00, stockQuantity: 5,  lowStockThreshold: 10,  unit: 'Vials',    location: 'Fridge F1', description: 'Long-acting insulin for diabetes', createdAt: '2026-02-10T00:00:00.000Z' },
    { id: 'MED-1005', name: 'Metformin 850mg',      genericName: 'Metformin HCl',    category: 'Tablet',    manufacturer: 'GlucoPharm',      batchNumber: 'BT-2024-005', expiryDate: '2027-06-30', purchasePrice: 0.08, sellingPrice: 0.25, stockQuantity: 200, lowStockThreshold: 30,  unit: 'Tablets',  location: 'Shelf A3', description: 'Oral diabetes medication', createdAt: '2026-03-05T00:00:00.000Z' },
    { id: 'MED-1006', name: 'Hydrocortisone Cream', genericName: 'Hydrocortisone',   category: 'Cream',     manufacturer: 'DermaCare Co',    batchNumber: 'BT-2024-006', expiryDate: '2027-01-31', purchasePrice: 1.20, sellingPrice: 3.50, stockQuantity: 30,  lowStockThreshold: 10,  unit: 'Units',    location: 'Shelf D1', description: 'Topical corticosteroid for inflammation', createdAt: '2026-03-20T00:00:00.000Z' }
  ],
  medicalRecords: [
    { _id: 'mr-1', recordId: 'MR-1001', patientId: 'SC-PAT-10001', doctorId: 'doc-1', recordType: 'Diagnosis', recordDate: '2026-07-10', title: 'Essential Hypertension', description: 'Patient presented with elevated blood pressure reading (145/92 mmHg). Recommended lifestyle modifications and low-sodium diet.', findings: 'Stage 1 Hypertension', recommendations: 'Daily BP log, follow-up in 2 weeks', severity: 'Medium', status: 'Active', tags: ['Cardiology', 'Hypertension'], isConfidential: false, createdBy: 'doc-1', createdAt: '2026-07-10T10:00:00.000Z' },
    { _id: 'mr-2', recordId: 'MR-1002', patientId: 'SC-PAT-10001', doctorId: 'doc-1', recordType: 'Lab Test',  recordDate: '2026-07-12', title: 'Lipid Profile Panel', description: 'Total cholesterol 210 mg/dL, HDL 45 mg/dL, LDL 135 mg/dL, Triglycerides 150 mg/dL.', findings: 'Mild hyperlipidemia', recommendations: 'Dietary counseling', severity: 'Low', status: 'Active', tags: ['Lab', 'Lipid'], isConfidential: false, createdBy: 'doc-1', createdAt: '2026-07-12T11:00:00.000Z' },
    { _id: 'mr-3', recordId: 'MR-1003', patientId: 'SC-PAT-10002', doctorId: 'doc-2', recordType: 'Allergy',   recordDate: '2026-06-05', title: 'Penicillin Hypersensitivity', description: 'Patient reports mild urticaria following oral amoxicillin administration.', findings: 'Type 1 IgE-mediated allergic response', recommendations: 'Avoid beta-lactam antibiotics', severity: 'High', status: 'Active', tags: ['Allergy', 'Penicillin'], isConfidential: false, createdBy: 'doc-2', createdAt: '2026-06-05T09:00:00.000Z' }
  ],
  prescriptions: [
    {
      _id: 'rx-1', prescriptionId: 'RX-10001',
      patientId: 'SC-PAT-10001', patientName: 'Alice Johnson',
      doctorId: 'doc-1', doctorName: 'Dr. Sarah Connor',
      appointmentId: 'apt-1', diagnosis: 'Essential Hypertension — Stage 1',
      medications: [
        { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: 30, instructions: 'Take with water in the morning' },
        { name: 'Hydrochlorothiazide', dosage: '12.5mg', frequency: 'Once daily', duration: 30, instructions: 'Take with food' }
      ],
      notes: 'Monitor BP weekly. Reduce sodium intake.', issuedDate: '2026-07-10', expiryDate: '2026-08-10',
      followUpDate: '2026-07-25', status: 'Active', refillsAllowed: 2, refillsUsed: 0,
      createdBy: 'doc-1', createdAt: '2026-07-10T10:00:00.000Z', updatedAt: '2026-07-10T10:00:00.000Z'
    },
    {
      _id: 'rx-2', prescriptionId: 'RX-10002',
      patientId: 'SC-PAT-10002', patientName: 'Bob Smith',
      doctorId: 'doc-4', doctorName: 'Dr. Robert Chen',
      appointmentId: 'apt-2', diagnosis: 'Upper Respiratory Tract Infection',
      medications: [
        { name: 'Azithromycin', dosage: '500mg', frequency: 'Once daily', duration: 5, instructions: 'Take 1 hour before or 2 hours after meals' },
        { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours', duration: 5, instructions: 'For fever and pain relief' }
      ],
      notes: 'Rest and increase fluid intake.', issuedDate: '2026-07-18', expiryDate: '2026-08-18',
      followUpDate: null, status: 'Active', refillsAllowed: 1, refillsUsed: 0,
      createdBy: 'doc-4', createdAt: '2026-07-18T11:00:00.000Z', updatedAt: '2026-07-18T11:00:00.000Z'
    },
    {
      _id: 'rx-3', prescriptionId: 'RX-10003',
      patientId: 'SC-PAT-10004', patientName: 'Diana Prince',
      doctorId: 'doc-3', doctorName: 'Dr. Emily Davis',
      appointmentId: null, diagnosis: 'Tension-type Headache',
      medications: [
        { name: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily', duration: 7, instructions: 'Take after meals' }
      ],
      notes: 'Avoid screen time. Reduce stress.', issuedDate: '2026-07-20', expiryDate: '2026-08-20',
      followUpDate: null, status: 'Active', refillsAllowed: 0, refillsUsed: 0,
      createdBy: 'doc-3', createdAt: '2026-07-20T09:00:00.000Z', updatedAt: '2026-07-20T09:00:00.000Z'
    }
  ]
};

const fs = require('fs');
const path = require('path');
const dbFilePath = path.join(__dirname, 'db.json');

// Load from file if exists
try {
  if (fs.existsSync(dbFilePath)) {
    const fileData = fs.readFileSync(dbFilePath, 'utf8');
    const parsedData = JSON.parse(fileData);
    global.memoryStore = { ...memoryStore, ...parsedData };
  } else {
    global.memoryStore = memoryStore;
  }
} catch (err) {
  console.error('Error loading memory store from disk:', err.message);
  global.memoryStore = memoryStore;
}

// Save to disk every 5 seconds
setInterval(() => {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(global.memoryStore, null, 2));
  } catch (err) {
    console.error('Error saving memory store to disk:', err.message);
  }
}, 5000);

module.exports = global.memoryStore;
