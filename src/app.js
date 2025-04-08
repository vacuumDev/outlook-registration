import OutlookGenerator from "./outlook.js";

(async () => {
    const gen = new OutlookGenerator({ proxy: { host: '127.0.0.1', port: 9090 } });
    const { email, password, result } = await gen.generateAccount({
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '17:11:1999',
        country: 'EG'
    });
    console.log('Created:', email, password, result);
})();