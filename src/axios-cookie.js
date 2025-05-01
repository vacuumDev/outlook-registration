import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

// 1) create your cookie jar
const cookieJar = new CookieJar();

// 2) wrap axios (adds jar support)
const axiosCookie = wrapper(axios.create({
    jar: cookieJar,        // tough-cookie jar
    withCredentials: true,
    proxy: {
        protocol: 'http',
        host: '127.0.0.1',
        port: 9090
    }
}));

export default axiosCookie;