import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import {HttpsProxyAgent} from "https-proxy-agent";
import {HttpProxyAgent} from "http-proxy-agent";
import config from "./config.js";
import {getValidProxy} from "./helper.js";

// 1) create your cookie jar
const cookieJar = new CookieJar();

const proxyUrl = await getValidProxy();
const proxy = new HttpProxyAgent(proxyUrl);

// 2) wrap axios (adds jar support)
const axiosCookie = wrapper(axios.create({
    jar: cookieJar,        // tough-cookie jar
    withCredentials: true,
    proxy: {
        protocol: 'http',
        host: proxy.proxy.hostname,
        port: proxy.proxy.port,
        auth: {
            username: proxy.proxy.username,
            password: proxy.proxy.password
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