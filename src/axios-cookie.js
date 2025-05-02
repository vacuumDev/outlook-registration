import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import {HttpsProxyAgent} from "https-proxy-agent";

// 1) create your cookie jar
const cookieJar = new CookieJar();

// 2) wrap axios (adds jar support)
const axiosCookie = wrapper(axios.create({
    jar: cookieJar,        // tough-cookie jar
    withCredentials: true,
    proxy: {
        protocol: 'http',
        host: 'gate.nodemaven.com',
        port: 8080,
        auth: {
            username: 'maddnivan_gmail_com-country-il-sid-1111111111114-filter-medium',
            password: 'hy9o97m71v'
        }
    }
}));

axiosCookie.interceptors.response.use(response => {
    const setCookies = response.headers['set-cookie']
    if (setCookies) {
        setCookies.forEach(cookieStr =>
            cookieJar.setCookieSync(cookieStr, response.config.url)
        )
    }
    return response
}, err => {
    // also handle the redirect case
    if (err.response && err.response.headers['set-cookie']) {
        err.response.headers['set-cookie'].forEach(cookieStr =>
            cookieJar.setCookieSync(cookieStr, err.response.config.url)
        )
        return Promise.resolve(err.response)
    }
    return Promise.reject(err)
})

axiosCookie.interceptors.request.use(async config => {
    // compute full URL
    const fullUrl = config.baseURL
        ? new URL(config.url, config.baseURL).toString()
        : config.url;
    // get all matching cookies
    const cookieHeader = await cookieJar.getCookieString(fullUrl);
    if (cookieHeader) {
        config.headers['Cookie'] = cookieHeader;
    }
    return config;
});



export default axiosCookie;