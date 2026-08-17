const request = require('supertest');
const app = require('../server');

describe('Patients API Tests', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Doctor Who',
        email: 'doctor@example.com',
        password: 'password123',
        role: 'doctor'
      });
    token = res.body.token;
  });

  it('should create a new patient', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        contactNumber: '1234567890',
        email: 'johndoe@example.com',
        address: '123 Main St'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty('firstName', 'John');
  });

  it('should fetch all patients', async () => {
    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: '1992-02-02',
        gender: 'Female',
        contactNumber: '0987654321',
        email: 'janedoe@example.com'
      });

    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('firstName');
  });

  it('should fetch a single patient by ID', async () => {
    const createRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Mark',
        lastName: 'Smith',
        dateOfBirth: '1985-05-05',
        gender: 'Male',
        contactNumber: '1122334455'
      });
    
    const patientId = createRes.body.data._id;

    const res = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('firstName', 'Mark');
  });

  it('should update a patient', async () => {
    const createRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Alice',
        lastName: 'Brown',
        dateOfBirth: '1995-10-10',
        gender: 'Female',
        contactNumber: '5544332211'
      });
    
    const patientId = createRes.body.data._id;

    const updateRes = await request(app)
      .put(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Alicia'
      });
    
    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body.data).toHaveProperty('firstName', 'Alicia');
  });

  it('should delete a patient', async () => {
    const createRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Bob',
        lastName: 'White',
        dateOfBirth: '1980-12-12',
        gender: 'Male',
        contactNumber: '6677889900'
      });
    
    const patientId = createRes.body.data._id;

    const deleteRes = await request(app)
      .delete(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(deleteRes.statusCode).toEqual(200);

    const getRes = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(getRes.statusCode).toEqual(404);
  });
});
