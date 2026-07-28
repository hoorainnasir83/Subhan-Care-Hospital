const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Subhan Care HMS API',
      version: '1.0.0',
      description: 'Hospital Management System API Documentation - Complete API reference for Subhan Care HMS',
      contact: {
        name: 'Subhan Care Support',
        email: 'support@subhancare.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development Server',
      },
      {
        url: 'https://api.subhancare.com/api',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            _id: {
              type: 'string',
              format: 'mongodb',
              description: 'User ID (MongoDB ObjectId)',
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'User full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address (unique)',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              description: 'Hashed password (8+ chars, must include uppercase, lowercase, numbers)',
            },
            role: {
              type: 'string',
              enum: ['Admin', 'Doctor', 'Receptionist', 'Billing', 'Patient', 'Staff'],
              description: 'User role',
            },
            doctorId: {
              type: 'string',
              format: 'mongodb',
              description: 'Reference to Doctor profile (if role is Doctor)',
            },
            patientId: {
              type: 'string',
              format: 'mongodb',
              description: 'Reference to Patient profile (if role is Patient)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last account update timestamp',
            },
          },
        },
        Patient: {
          type: 'object',
          required: ['name', 'email', 'userId'],
          properties: {
            _id: {
              type: 'string',
              format: 'mongodb',
              description: 'Patient ID',
            },
            userId: {
              type: 'string',
              format: 'mongodb',
              description: 'Reference to User document',
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Patient full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Patient email address',
            },
            phone: {
              type: 'string',
              pattern: '^[0-9\\s\\-\\(\\)]+$',
              description: 'Patient phone number',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Patient date of birth (YYYY-MM-DD)',
            },
            gender: {
              type: 'string',
              enum: ['Male', 'Female', 'Other'],
              description: 'Patient gender',
            },
            bloodGroup: {
              type: 'string',
              enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
              description: 'Blood group',
            },
            address: {
              type: 'string',
              maxLength: 200,
              description: 'Residential address',
            },
            allergies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', format: 'mongodb' },
                  name: { type: 'string', description: 'Allergen name' },
                  severity: {
                    type: 'string',
                    enum: ['Mild', 'Moderate', 'Severe'],
                    description: 'Allergy severity level',
                  },
                },
              },
              description: 'List of known allergies',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Patient record creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last patient record update',
            },
          },
        },
        Doctor: {
          type: 'object',
          required: ['name', 'userId'],
          properties: {
            _id: {
              type: 'string',
              format: 'mongodb',
              description: 'Doctor ID',
            },
            userId: {
              type: 'string',
              format: 'mongodb',
              description: 'Reference to User document',
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Doctor full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Doctor email address',
            },
            phone: {
              type: 'string',
              pattern: '^[0-9\\s\\-\\(\\)]+$',
              description: 'Doctor contact number',
            },
            specialization: {
              type: 'string',
              maxLength: 100,
              description: 'Medical specialization',
            },
            experience: {
              type: 'integer',
              minimum: 0,
              maximum: 70,
              description: 'Years of experience',
            },
            qualification: {
              type: 'string',
              maxLength: 100,
              description: 'Medical qualifications',
            },
            availableSlots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                  time: { type: 'string', pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' },
                  available: { type: 'boolean' },
                },
              },
              description: 'Doctor availability slots',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Doctor profile creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last doctor profile update',
            },
          },
        },
        Appointment: {
          type: 'object',
          required: ['doctorId', 'appointmentDate', 'appointmentTime'],
          properties: {
            _id: {
              type: 'string',
              format: 'mongodb',
              description: 'Appointment ID',
            },
            doctorId: {
              type: 'string',
              format: 'mongodb',
              description: 'Reference to Doctor',
            },
            patientId: {
              type: 'string',
              format: 'mongodb',
              description: 'Reference to Patient',
            },
            appointmentDate: {
              type: 'string',
              format: 'date',
              description: 'Appointment date (YYYY-MM-DD)',
            },
            appointmentTime: {
              type: 'string',
              pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Appointment time (HH:MM 24-hour format)',
            },
            reason: {
              type: 'string',
              maxLength: 500,
              description: 'Reason for appointment',
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
              default: 'Pending',
              description: 'Appointment status',
            },
            notes: {
              type: 'string',
              maxLength: 1000,
              description: 'Additional notes',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Appointment creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last appointment update',
            },
          },
        },
        Invoice: {
          type: 'object',
          required: ['patientId', 'amount'],
          properties: {
            _id: {
              type: 'string',
              format: 'mongodb',
              description: 'Invoice ID',
            },
            patientId: {
              type: 'string',
              format: 'mongodb',
              description: 'Reference to Patient',
            },
            appointmentId: {
              type: 'string',
              format: 'mongodb',
              description: 'Reference to Appointment (if applicable)',
            },
            amount: {
              type: 'number',
              minimum: 0,
              description: 'Invoice amount',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Invoice description/services',
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Paid', 'Cancelled'],
              default: 'Pending',
              description: 'Payment status',
            },
            dueDate: {
              type: 'string',
              format: 'date',
              description: 'Due date for payment',
            },
            paidDate: {
              type: 'string',
              format: 'date',
              description: 'Date of payment',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Invoice creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last invoice update',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'object',
              description: 'Error details (development only)',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './routes/auth.js',
    './routes/patients.js',
    './routes/doctors.js',
    './routes/appointments.js',
    './routes/invoices.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
