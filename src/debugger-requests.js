import axiosCookie from './axios-cookie.js';
import puppeteer from 'puppeteer';
import fs from 'fs';

let requestParams = '';
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createAccount(uiflvr, scid, hpgid, uaid) {
    const requestTimeStamp = new Date().toISOString();

    return axiosCookie.post(
        `https://signup.live.com/API/CreateAccount?${requestParams}`,
        {
            BirthDate: "17:10:1999",
            CheckAvailStateMap: ["jibtoxamil123@outlook.com:false"],
            Country: "IL",
            EvictionWarningShown: [],
            FirstName: "Abna-Diana",
            IsRDM: false,
            IsOptOutEmailDefault: true,
            IsOptOutEmailShown: 1,
            IsOptOutEmail: true,
            IsUserConsentedToChinaPIPL: false,
            LastName: "Peacocks",
            LW: 1,
            MemberName: "jibtoxamil123@outlook.com",
            RequestTimeStamp: requestTimeStamp,
            ReturnUrl: "",
            SignupReturnUrl: "",
            SuggestedAccountType: "OUTLOOK",
            SiteId: "292841",
            VerificationCodeSlt: "",
            PrivateAccessToken: "",
            WReply: `https%3a%2f%2foutlook.live.com%2fowa%2f%3fnlp%3d1%26signup%3d1%26RpsCsrfState%3d${new URLSearchParams(decodeURIComponent(requestParams)).get('RpsCsrfState')}`,
            MemberNameChangeCount: 1,
            MemberNameAvailableCount: 1,
            MemberNameUnavailableCount: 0,
            Password: "vq2i!sZz",
            uiflvr,
            scid,
            uaid,
            hpgid
        },
        {
            headers: {
                Host: 'signup.live.com',
                'Content-Type': 'application/json; charset=utf-8',
                accept: 'application/json',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                origin: 'https://signup.live.com',
                referer: 'https://signup.live.com/',
                'sec-fetch-dest': 'empty',
                'accept-language': 'en-US',
                'Accept-Encoding': 'gzip, deflate'
            }
        }
    );
}



async function checkAvailableSigninNames(uiflvr, scid, hpgid, uaid) {
    return axiosCookie.post(
        `https://signup.live.com/API/CheckAvailableSigninNames?${requestParams}`,
        {
            includeSuggestions: true,
            signInName: 'jibtoxamil123@outlook.com',
            uiflvr,
            scid,
            uaid,
            hpgid
        },
        {
            headers: {
                Host: 'signup.live.com',
                'Content-Type': 'application/json; charset=utf-8',
                accept: 'application/json',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                origin: 'https://signup.live.com',
                referer: 'https://signup.live.com/',
                'sec-fetch-dest': 'empty',
                'Accept-Encoding': 'gzip, deflate'
            }
        }
    );
}


const executeClearPage = async (pathToHtml) => {
    // 1. Launch headless Chrome
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    // 2. Collect every URL the page requests
    const urls = new Set();
    page.on('request', r => urls.add(r.url()));

    // 3. Load your local HTML (or a remote URL)
    await page.goto(pathToHtml, {
        waitUntil: 'networkidle2'
    });

    await delay(5_000);

    await browser.close();

    console.log('Captured URLs:');
    for (const url of urls) console.log(url);

    // 4. (Optional) replay them with Axios
    for (const url of urls) {
        try {
            const res = await axiosCookie.get(url);
            console.log(`${url} → ${res.status}`);
        } catch (e) {
            console.error(`✗ ${url}`, e.message);
        }
    }
}


async function fetchFptLiveIframe(urlDfp) {
    return axiosCookie.get(
        urlDfp,
        {
            headers: {
                Host: 'fpt.live.com',
                'sec-fetch-dest': 'iframe',
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1',
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                referer: 'https://signup.live.com/',
                'sec-fetch-site': 'same-site',
                'sec-fetch-mode': 'navigate',
                'accept-language': 'en-US',
                Connection: 'keep-alive',
                Cookie: 'amsc=JB10XspCqJnugcoQmSbRh+VLyse5sAmFC5UkdHS7Zuxf3gzDnYlXxyY1SU+jRQcVo1QdCARaIIBBGNjYYCB96RFc0EsTEL5UJAIopxIDoLbFo947cRarQDDdzj/90IeunbRd+CiKccioN2FQWE6fYqX1LYt38wAkhJWnxi4CF2JcsncbG/xCqSUIZ6IvhNjzFH0GDdA/+e8P1Z3zCSsaWoRI6AsPuTEmyHmT953EjwS7dJQGT/vQ4rSiYU0Pshl94F+050SK1eTAh2wR8l4ZhLNvv0ojPhZ8dBRNCqBaYvzCAwmSkhgr9BjMSXt5VvYf:2:3c; logonLatency=LGN01=638804896082439643',
                'Accept-Encoding': 'gzip, deflate'
            }
        }
    );
}


async function fetchHsProtectIframe(urlDfp) {
    return axiosCookie.get(
        urlDfp,
        {
            headers: {
                Host: 'iframe.hsprotect.net',
                'Sec-Fetch-Dest': 'iframe',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                Referer: 'https://signup.live.com/',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'navigate',
                'Accept-Language': 'en-US',
                Connection: 'keep-alive',
                'Accept-Encoding': 'gzip, deflate'
            }
        }
    );
}


function extractServerData(html) {
    const re = /var\s+ServerData\s*=\s*(\{[\s\S]*?\})\s*;/;
    const match = html.match(re);
    if (!match) {
        throw new Error('ServerData not found in HTML');
    }
    return JSON.parse(match[1]);
}

async function evaluateExperimentAssignments() {
    return axiosCookie.post(
        'https://signup.live.com/API/EvaluateExperimentAssignments',
        {"clientExperiments":[{"parallax":"addprivatebrowsingtexttofabricfooter","control":"addprivatebrowsingtexttofabricfooter_control","treatments":["addprivatebrowsingtexttofabricfooter_treatment"]},{"parallax":"updateuseformsubmissionfocuslogic","control":"updateuseformsubmissionfocuslogic_control","treatments":["updateuseformsubmissionfocuslogic_treatment"]},{"parallax":"loadgamepadnavigationmoduleloginfluent","control":"loadgamepadnavigationmoduleloginfluent_control","treatments":["loadgamepadnavigationmoduleloginfluent_treatment"]}]},
        {
            headers: {
                Host: 'signup.live.com',
                'Content-Type': 'application/json; charset=utf-8',
                accept: 'application/json',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                origin: 'https://signup.live.com',
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1',
                referer: 'https://signup.live.com/',
                'sec-fetch-dest': 'empty',
                'accept-language': 'en-US',
                'Accept-Encoding': 'gzip, deflate'
            }
        }
    );
}

async function fetchOwaSignupPage() {
    let firstRedirect = null;
    let url = 'https://outlook.live.com/owa/?nlp=1&signup=1';
    let response;

    while (true) {
        try {
            response = await axiosCookie.get(url, {
                headers: {
                    Host: 'outlook.live.com',
                    'sec-fetch-dest': 'document',
                    'user-agent':
                        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1',
                    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'sec-fetch-site': 'none',
                    'sec-fetch-mode': 'navigate',
                    'accept-language': 'en-US',
                    'accept-encoding': 'gzip, deflate',
                },
                maxRedirects: 0,
                validateStatus: status => status >= 200 && status < 400,
            });
        } catch (err) {
            if (err.response && err.response.status === 302) {
                response = err.response;
            } else {
                throw err;
            }
        }

        if (response.status === 302) {
            const location = response.headers.location;
            if (!firstRedirect) {
                firstRedirect = location;
            }
            url = location.startsWith('http') ? location : new URL(location, url).toString();
            continue;
        }

        // статус 200 — выходим из цикла
        break;
    }

    requestParams = firstRedirect.replace('https://signup.live.com/signup?', '');
    return extractServerData(response.data);
}

const main = async () => {

    const serverData = await fetchOwaSignupPage();
    console.log(serverData);

    axiosCookie.interceptors.request.use(config => {
        if(config.url.startsWith('https://signup.live.com')) {
            config.headers['hpgid'] = serverData.hpgid.toString();
            config.headers['hpgact'] = '0';
            config.headers['correlationId'] = serverData.sUnauthSessionID.toString();
            config.headers['client-request-id'] = serverData.sUnauthSessionID.toString();
            config.headers['canary'] = serverData.apiCanary;
        }

        return config;
    })

    await evaluateExperimentAssignments();
    await fetchHsProtectIframe(serverData.urlHumanIframe);
    const { data } = await fetchFptLiveIframe(serverData.oCaptchaInfo.urlDfp);
    const path = process.cwd() + '/index.html';
    fs.writeFileSync(path, data);
    await executeClearPage('file://' + path)
    await checkAvailableSigninNames(Number(serverData.iUiFlavor), Number(serverData.iScenarioId), serverData.hpgid, serverData.sUnauthSessionID);
    const res = await createAccount(Number(serverData.iUiFlavor), Number(serverData.iScenarioId), serverData.hpgid, serverData.sUnauthSessionID)
    console.log(res)
}


main();