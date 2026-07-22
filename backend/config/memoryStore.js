const bcrypt = require('bcryptjs');

const memoryStore = {
  users: [
    { id: 'u1', name: 'Subhan Administrator',  email: 'admin@subhancare.com',        passwordHash: bcrypt.hashSync('admin123', 10),        role: 'Admin',        doctorId: null },
    { id: 'u2', name: 'Dr. Sarah Connor',      email: 'doctor@subhancare.com',       passwordHash: bcrypt.hashSync('doctor123', 10),       role: 'Doctor',       doctorId: 'doc-1' },
    { id: 'u3', name: 'Reception Staff',       email: 'receptionist@subhancare.com', passwordHash: bcrypt.hashSync('receptionist123', 10), role: 'Receptionist', doctorId: null },
    { id: 'u4', name: 'Billing Officer',       email: 'billing@subhancare.com',      passwordHash: bcrypt.hashSync('billing123', 10),      role: 'Billing',      doctorId: null }
  ],
  doctors: [
    { id: 'doc-1', name: 'Dr. Sarah Connor',  specialty: 'Cardiology',       phone: '+1 (555) 019-2834', email: 'sarah.connor@subhancare.com',  availability: 'Mon - Fri (9 AM - 5 PM)',          fee: 150, rating: 4.9, consultsCount: 28 },
    { id: 'doc-2', name: 'Dr. John Smith',    specialty: 'Pediatrics',        phone: '+1 (555) 014-9283', email: 'john.smith@subhancare.com',    availability: 'Mon - Thu (10 AM - 4 PM)',          fee: 120, rating: 4.7, consultsCount: 34 },
    { id: 'doc-3', name: 'Dr. Emily Davis',   specialty: 'Neurology',         phone: '+1 (555) 017-3849', email: 'emily.davis@subhancare.com',   availability: 'Tue, Thu, Fri (8 AM - 2 PM)',      fee: 200, rating: 4.8, consultsCount: 19 },
    { id: 'doc-4', name: 'Dr. Robert Chen',   specialty: 'General Medicine',  phone: '+1 (555) 012-4758', email: 'robert.chen@subhancare.com',   availability: 'Mon - Sat (9 AM - 1 PM)',           fee: 100, rating: 4.5, consultsCount: 52 }
  ],
  patients: [
    { id: 'SC-PAT-10001', name: 'Alice Johnson',  dob: '1992-03-15', gender: 'Female', cnic: '35201-1234567-1', phone: '+1 (555) 015-3829', email: 'alice.j@gmail.com',     bloodGroup: 'O+',  emergencyContact: 'Bob Johnson (+1 555-111-0001)',  address: '123 Maple St, Springfield',    registeredDate: '2026-07-02' },
    { id: 'SC-PAT-10002', name: 'Bob Smith',       dob: '1981-07-22', gender: 'Male',   cnic: '35202-9876543-2', phone: '+1 (555) 011-2834', email: 'bob.smith@yahoo.com',   bloodGroup: 'A-',  emergencyContact: 'Jane Smith (+1 555-222-0002)',   address: '456 Oak Rd, Riverdale',        registeredDate: '2026-06-15' },
    { id: 'SC-PAT-10003', name: 'Charlie Brown',   dob: '2014-11-05', gender: 'Male',   cnic: '35203-1122334-3', phone: '+1 (555) 018-9382', email: 'charlie.b@gmail.com',  bloodGroup: 'B+',  emergencyContact: 'Linda Brown (+1 555-333-0003)', address: '789 Pine Ave, Greendale',      registeredDate: '2026-07-10' },
    { id: 'SC-PAT-10004', name: 'Diana Prince',    dob: '1998-06-30', gender: 'Female', cnic: '35204-5566778-4', phone: '+1 (555) 016-4839', email: 'diana.p@amazon.com',   bloodGroup: 'AB+', emergencyContact: 'Clark Prince (+1 555-444-0004)', address: '101 Amazon Way, Themyscira',   registeredDate: '2026-07-19' }
  ],
  appointments: [
    { id: 'apt-1', patientId: 'SC-PAT-10001', patientName: 'Alice Johnson',  doctorId: 'doc-1', doctorName: 'Dr. Sarah Connor',  date: '2026-07-22', time: '10:00', fee: 150, status: 'Scheduled' },
    { id: 'apt-2', patientId: 'SC-PAT-10002', patientName: 'Bob Smith',       doctorId: 'doc-4', doctorName: 'Dr. Robert Chen',   date: '2026-07-23', time: '11:30', fee: 100, status: 'Scheduled' },
    { id: 'apt-3', patientId: 'SC-PAT-10004', patientName: 'Diana Prince',    doctorId: 'doc-3', doctorName: 'Dr. Emily Davis',   date: '2026-07-24', time: '14:00', fee: 200, status: 'Cancelled' },
    { id: 'apt-4', patientId: 'SC-PAT-10003', patientName: 'Charlie Brown',   doctorId: 'doc-2', doctorName: 'Dr. John Smith',    date: '2026-07-25', time: '09:30', fee: 120, status: 'Scheduled' }
  ],
  invoices: [
    { id: 'INV-1001', patientId: 'SC-PAT-10001', patientName: 'Alice Johnson', date: '2026-07-15', dueDate: '2026-07-22', paymentMethod: 'Card',          services: [{ name: 'General Cardiology Consultation', cost: 150 }, { name: 'Electrocardiogram (ECG)', cost: 80 }],       subtotal: 230,  taxRate: 8,  taxAmount: 18.4, totalAmount: 248.4, status: 'Paid' },
    { id: 'INV-1002', patientId: 'SC-PAT-10002', patientName: 'Bob Smith',      date: '2026-07-18', dueDate: '2026-07-25', paymentMethod: 'Cash',          services: [{ name: 'Physician Consultation', cost: 100 }, { name: 'Urinalysis & Lab Workup', cost: 45 }],              subtotal: 145,  taxRate: 5,  taxAmount: 7.25, totalAmount: 152.25, status: 'Unpaid' },
    { id: 'INV-1003', patientId: 'SC-PAT-10004', patientName: 'Diana Prince',   date: '2026-07-20', dueDate: '2026-07-27', paymentMethod: 'Bank Transfer',  services: [{ name: 'Neurology Consultation', cost: 200 }, { name: 'MRI Brain Scan', cost: 450 }],                    subtotal: 650,  taxRate: 10, taxAmount: 65,   totalAmount: 715,    status: 'Paid' }
  ]
};

global.memoryStore = memoryStore;

module.exports = memoryStore;
