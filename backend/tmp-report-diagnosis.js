const fetch = globalThis.fetch;

(async () => {
  try {
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@subhancare.com', password: 'admin123' }),
    });
    const loginBody = await loginRes.text();
    console.log('LOGIN_STATUS', loginRes.status);
    console.log('LOGIN_BODY', loginBody);

    const login = JSON.parse(loginBody);
    const token = login.token;
    if (!token) {
      console.error('No token returned');
      process.exit(1);
    }

    const reportRes = await fetch('http://127.0.0.1:5000/api/reports/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const reportBody = await reportRes.text();
    console.log('REPORT_STATUS', reportRes.status);
    console.log('REPORT_BODY', reportBody);
  } catch (error) {
    console.error('FETCH_ERROR', error.message);
    if (error.response) {
      try {
        const text = await error.response.text();
        console.error('ERROR_BODY', text);
      } catch (_) {}
    }
    console.error(error);
  }
})();
