import 'dotenv/config';
import createAxios from './axios-cookie.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import Generator from "./generator.js";
import config from "./config.js";
import {getRandomElement} from "./helper.js";
import axios from "axios";
import FileHandler from "./file-handler.js";


let requestParams = '';
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const country = getRandomElement(config.COUNTRIES)

let userData = Generator.generateFakeUserData(country);

const axiosCookie = await createAxios(userData.country);

async function createAccount(uiflvr, scid, hpgid, uaid) {
    const requestTimeStamp = new Date().toISOString();

    return axiosCookie.post(
        `https://signup.live.com/API/CreateAccount?${requestParams}`,
        {
            BirthDate: userData.birthDate,
            CheckAvailStateMap: [`${userData.memberName}:false`],
            Country: userData.country,
            EvictionWarningShown: [],
            FirstName: userData.firstName,
            IsRDM: false,
            IsOptOutEmailDefault: true,
            IsOptOutEmailShown: 1,
            IsOptOutEmail: true,
            IsUserConsentedToChinaPIPL: false,
            LastName: userData.lastName,
            LW: 1,
            MemberName: userData.memberName,
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
            Password: userData.password,
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
            signInName: userData.memberName,
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

async function solveCaptcha(websiteURL, data) {
    const clientKey = config.EZ_CAPTCHA_KEY;
    const appId = '80212';
    const websiteKey = 'B7D8911C-5CC8-A9A3-35B0-554ACEE604DA';

    // 1. Create a new captcha-solving task
    const createResponse = await axios.post(
        'https://api.ez-captcha.com/createTask',
        {
            clientKey,
            appId,
            task: {
                type: 'FuncaptchaTaskProxyless',
                websiteURL,
                websiteKey,
                data: JSON.stringify({ blob: data })
            }
        }
    );

    const taskId = createResponse.data.taskId;
    console.log(createResponse.data)
    if (!taskId) {
        throw new Error('Failed to create captcha task');
    }

    // 2. Poll for the result until it's ready
    while (true) {
        // wait 5 seconds between polls
        await new Promise(resolve => setTimeout(resolve, 5000));

        const resultResponse = await axios.post(
            'https://api.ez-captcha.com/getTaskResult',
            { clientKey, taskId }
        );

        const resultData = resultResponse.data;
        if (resultData.status === 'ready') {
            // solution is in resultData.solution
            return resultData.solution.token;
        }

        // otherwise, keep polling
    }
}

export async function createAccountCaptcha(
                                        uiflvr,
                                        scid,
                                        hpgid,
                                        uaid,
                                        riskAssessmentDetails,
                                        repMapRequestIdentifierDetails,
                                        HFId,
                                        HPId,
                                        HSol,
                                        HType,
                                        HId
                                    ) {
    // build the same query string you listed
    const qs = requestParams

    // assemble the body
    const body = {
        BirthDate: userData.birthDate,
        CheckAvailStateMap: [`${userData.memberName}:false`],
        Country: userData.country,
        EvictionWarningShown: [],
        FirstName: userData.firstName,
        IsRDM: false,
        IsOptOutEmailDefault: true,
        IsOptOutEmailShown: 1,
        IsOptOutEmail: true,
        IsUserConsentedToChinaPIPL: false,
        LastName: userData.lastName,
        LW: 1,
        MemberName: userData.memberName,
        RequestTimeStamp: new Date().toISOString(),
        ReturnUrl: '',
        SignupReturnUrl: '',
        SuggestedAccountType: 'OUTLOOK',
        SiteId: '292841',
        VerificationCodeSlt: '',
        WReply: `https%3a%2f%2foutlook.live.com%2fowa%2f%3fnlp%3d1%26signup%3d1%26RpsCsrfState%3d${new URLSearchParams(decodeURIComponent(requestParams)).get('RpsCsrfState')}`,
        MemberNameChangeCount: 1,
        MemberNameAvailableCount: 1,
        MemberNameUnavailableCount: 0,
        Password: userData.password,
        RiskAssessmentDetails: riskAssessmentDetails,
        RepMapRequestIdentifierDetails: repMapRequestIdentifierDetails,
        HFId,
        HPId,
        HSol,
        HType,
        HId,

        // ← and the tracking params:
        uiflvr,
        scid,
        uaid,
        hpgid
    };

    return axiosCookie.post(
        `https://signup.live.com/API/CreateAccount?${qs}`,
        body,
        {
            headers: {
                Host: 'signup.live.com',
                'Content-Type': 'application/json; charset=utf-8',
                accept: 'application/json',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                origin: 'https://signup.live.com',
                referer: `https://signup.live.com/signup?${requestParams}`,
                'sec-fetch-dest': 'empty',
                'accept-language': 'en-US',
                'accept-encoding': 'gzip, deflate'
            }
        }
    );
}
async function signupWithCaptchaLoop(serverData, requestParams) {
    const {
        iUiFlavor,
        iScenarioId,
        hpgid,
        sUnauthSessionID,
        oCaptchaInfo: { sHipFid: HFId }
    } = serverData;

    // these never change
    const HPId = 'B7D8911C-5CC8-A9A3-35B0-554ACEE604DA';
    const HType = 'enforcement';

    // 1) First, try without any captcha tokens
    const initial = await createAccount(
        Number(iUiFlavor),
        Number(iScenarioId),
        hpgid,
        sUnauthSessionID
    );
    console.log('initial createAccount →', initial.data);

    // if there was no error, we’re done
    if (!initial.data.error) {
        return initial;
    }

    // otherwise pull out the Arkose blob & details
    let details = JSON.parse(initial.data.error.data);
    let resp;

    // 2) now loop: solve + re-submit until success
    while (true) {
        const { arkoseBlob, riskAssessmentDetails, repMapRequestIdentifierDetails } = details;

        // solve the captcha
        const captchaToken = await solveCaptcha(
            `https://signup.live.com/API/CreateAccount?${requestParams}`,
            arkoseBlob
        );
        console.log('got captchaToken →', captchaToken);

        // re-submit with all the Arkose fields + token
        resp = await createAccountCaptcha(
            Number(iUiFlavor),
            Number(iScenarioId),
            hpgid,
            sUnauthSessionID,
            riskAssessmentDetails,
            repMapRequestIdentifierDetails,
            HFId,
            HPId,
            captchaToken, // HSol
            HType,
            captchaToken  // HId
        );
        console.log('createAccountCaptcha →', resp.data);

        // if that one succeeded, break out
        if (!resp.data.error) {
            return resp.data;
        }

        // else pull the new blob/details and loop again
        let v = JSON.parse(resp.data.error.data);
        if(v.arkoseBlob) {
            details.arkoseBlob = v.arkoseBlob;
        }

        if(v.riskAssessmentDetails) {
            details.riskAssessmentDetails = v.riskAssessmentDetails;
        }

        if(v.repMapRequestIdentifierDetails) {
            details.repMapRequestIdentifierDetails = v.repMapRequestIdentifierDetails;
        }
    }
}

async function postPPSecure(url, slt) {

    // your form-body exactly as captured
    const body =
        `slt=${slt}`;

    const res = await axiosCookie.post(
        url,
        body,
        {
            headers: {
                'Host': 'login.live.com',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:138.0) Gecko/20100101 Firefox/138.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://signup.live.com',
                'Referer': 'https://signup.live.com/',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-site',
                'Priority': 'u=0, i=0',
            }
        }
    );

    console.log(res.data)

    return res;
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
    const account = await signupWithCaptchaLoop(serverData, requestParams);
    await postPPSecure(account.redirectUrl, account.slt)
    await FileHandler.appendToFile('data/accounts.txt', userData)
}


main();