import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import * as cheerio from 'cheerio';
import {encrypt} from './Encryptor.js';       // your port of the Python Encryptor

function decodeUrl(encodedString) {
    return encodedString.replace(
        /\\u([0-9A-Fa-f]{4})/g,
        (_, hex) => String.fromCharCode(parseInt(hex, 16))
    );
}
export default class OutlookGenerator {
    constructor({ proxy = null } = {}) {
        // Create an axios instance with cookie jar support
        this.jar = new CookieJar();
        this.client = wrapper(axios.create({
            baseURL: 'https://signup.live.com',
            jar: this.jar,
            withCredentials: true,
            proxy: proxy ? {
                protocol: 'http',
                host: proxy.host,
                port: proxy.port
            } : false,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                    'Chrome/125.0.0.0 Safari/537.36',
            }
        }));
    }

    _randStr(len = 12) {
        return [...Array(len)].map(() =>
            String.fromCharCode(97 + Math.floor(Math.random() * 26))
        ).join('');
    }

    async _initialGet() {
        // Step 1: GET signup landing page
        const res1 = await this.client.get('/signup');
        const $ = cheerio.load(res1.data);
        // find first <a href=...>
        const href = $('a').first().attr('href');
        if (!href) throw new Error('Could not find signup link');

        return href;
    }

    async _getUaId() {
        // Step 2: GET login.live.com → redirect back to signup.live.com with uaid
        // The cookie jar will keep all cookies automatically.
        // now fetch the real signup with lic=1
        const res3 = await this.client.get(`/signup?lic=1`);
        const html = res3.data;
        // extract apiCanary, sHipFid, SKI, hpgid, iUiFlavor, iScenarioId
        const fields = {};
        for (const key of ['apiCanary','sHipFid','hpgid','iUiFlavor','iScenarioId', 'urlDfp', 'sUnauthSessionID']) {
            const re = new RegExp(`"${key}"\\s*[:=]\\s*"?([^",\\s}]+)"?`);
            const m = html.match(re);
            if (m) fields[key] = isNaN(m[1]) ? m[1] : Number(m[1]);
        }
        return fields;
    }

    async _fptFlow(url) {
        // Step 3: call fpt.live.com → extract txnId, ticks, rid, authKey, cid
        const res = await this.client.get(url, {
            headers: { Referer: 'https://signup.live.com' }
        });
        const $ = cheerio.load(res.data);
        let scriptText = '';
        $('script').each((i, s) => {
            const t = $(s).html();
            if (t && t.includes('txnId')) scriptText = t;
        });
        if (!scriptText) throw new Error('fpt script block not found');

        const extract = (k) => {
            const m = scriptText.match(new RegExp(`${k}\\s*=\\s*'([^']+)'`));
            if (!m) throw new Error(`${k} not found`);
            return m[1];
        };
        return {
            txnId: extract('txnId'),
            ticks: extract('ticks'),
            rid:   extract('rid'),
            authKey: extract('authKey'),
            cid: extract('cid')
        };
    }

    async _clearFpt2({ txnId, ticks, rid, authKey, cid }) {
        // Step 4: call fpt2.microsoft.com to finalize blob
        await this.client.get(`https://fpt2.microsoft.com/Clear.HTML?ctx=Ls1.0&wl=False` +
            `&session_id=${txnId}&id=${rid}&w=${ticks}&tkt=${authKey}&CustomerId=${cid}`, {
            headers: { Referer: 'https://fpt.live.com' }
        });
    }

    async _checkAvailable({ email, uaid, hpgid, scid, uiflvr, apiCanary }) {
        // Step 5: CheckAvailableSigninNames
        const url = '/API/CheckAvailableSigninNames';
        const payload = {
            signInName: email,
            uaid,
            includeSuggestions: true,
            uiflvr,
            scid,
            hpgid
        };
        const decodedCanary = decodeUrl(apiCanary);
        const res = await this.client.post(url, payload, {
            headers: {
                'Accept': 'application/json',
                'canary': decodedCanary,
                'correlationId': uaid,
                'hpgact': String(0),
                'hpgid': String(hpgid),
                'Origin': 'https://signup.live.com',
                'Referer': `https://signup.live.com/signup?lic=1`,
            }
        });
        return res.data;  // contains apiCanary, telemetryContext
    }

    async _reportEvent({ uaid, scid, hpgid, telemetryContext, apiCanary }) {
        // Step 6: ReportClientEvent
        const url = '/API/ReportClientEvent?lic=1';
        const ts = Date.now().toString();
        const payload = {
            pageApiId: hpgid + 1,
            clientTelemetryData: {
                category: 'PageView',
                pageName: (hpgid + 1).toString(),
                eventInfo: { timestamp: ts }
            },
            uiflvr: 1001,
            uaid,
            scid,
            hpgid: hpgid + 1,
            telemetryContext
        };
        const res = await this.client.post(url, payload, {
            headers: {
                'Accept': 'application/json',
                'canary': apiCanary,
                'tcxt': telemetryContext,
                'x-ms-apiTransport': 'xhr',
                'x-ms-apiVersion': '2',
                'Referer': 'https://signup.live.com/?lic=1'
            }
        });
        return res.data; // new apiCanary, telemetryContext
    }

    async _createAccount({ email, password, firstName, lastName, birthDate, country },
                         { apiCanary, telemetryContext, uaid, scid, hpgid, sHipFid, SKI }) {
        // Step 7: CreateAccount
        const url = '/API/CreateAccount?lic=1';
        const now = new Date().toISOString();
        const encrypted = new encrypt(password, telemetryContext.randomNum, telemetryContext.key);

        const payload = {
            RequestTimeStamp: now,
            MemberName: email,
            CheckAvailStateMap: [`${email}:undefined`],
            FirstName: firstName,
            LastName: lastName,
            BirthDate: birthDate,
            Country: country,
            SuggestedAccountType: 'EASI',
            HWId: sHipFid,
            SKI,
            CipherValue: encrypted,
            uaid, scid, hpgid: hpgid + 10
        };

        const res = await this.client.post(url, payload, {
            headers: {
                'Accept': 'application/json',
                'canary': apiCanary,
                'tcxt': telemetryContext,
                'x-ms-apiTransport': 'xhr',
                'x-ms-apiVersion': '2',
            }
        });
        return res.data;
    }

    /** Public entry: does the whole flow */
    async generateAccount({ firstName, lastName, birthDate, country = 'US' }) {
        const password = this._randStr(16);
        const email = `${this._randStr(10)}@outlook.com`;

        // 2. uaid + flavor + canary + etc.
        const sd = await this._getUaId();

        // 3. FPT flow
        const fpt = await this._fptFlow(sd.urlDfp);
        await this._clearFpt2(fpt);

        // 4. CheckAvailableSigninNames
        const chk = await this._checkAvailable({
            email, uaid: sd.sUnauthSessionID, hpgid: sd.hpgid, scid: sd.iScenarioId, uiflvr: sd.iUiFlavor,
            apiCanary: sd.apiCanary
        });

        // 5. ReportClientEvent
        const rpt = await this._reportEvent({
            uaid: sd.sUnauthSessionID, scid: sd.iScenarioId, hpgid: sd.hpgid,
            telemetryContext: chk.telemetryContext,
            apiCanary: chk.apiCanary
        });

        // 6. CreateAccount
        const result = await this._createAccount(
            { email, password, firstName, lastName, birthDate, country },
            {
                apiCanary: rpt.apiCanary,
                telemetryContext: rpt.telemetryContext,
                uaid: sd.uaid,
                scid: sd.iScenarioId,
                hpgid: sd.hpgid,
                sHipFid: sd.sHipFid,
                SKI: sd.SKI
            }
        );

        return { email, password, result };
    }
}
