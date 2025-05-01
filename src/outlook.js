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

    async _getUaId(uaid) {
        const res3 = await this.client.get(`/signup?lic=1&uaid=${uaid}`);
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

    async extractUaidFromRedirect() {
        try {
            // Делаем HEAD или GET-запрос чтобы поймать редирект в заголовках
            const res = await this.client.get('/signup', {
                maxRedirects: 0, // Важно! чтобы axios не следовал за редиректом, а дал нам заголовки
                validateStatus: (status) => status >= 200 && status < 400,
                headers:  {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                    'cookie': 'MUID=36f272f098f142468459a8154295145d; mkt=ru-RU; MicrosoftApplicationsTelemetryDeviceId=a020b93c-1af5-4d96-997d-4d39fdc3f2dd; _pxvid=342864b4-142e-11f0-82f3-0b51e6e0494c; MSFPC=GUID=c0a8bc0bfa684186b0320dae85cfaf81&HASH=c0a8&LV=202502&V=4&LU=1739724773598; amsc=Fujws4Fe0IxaJn0grYQc33IlKkDoS6q6krNAq73UGLoYqPCPcO7/1y0QmfxvisCCuIuWJb3AwVw3MRDMIpVkTlmP9AV0cBHkc39qJqgU03xWyq1X0joosyeaaVZ3+IqaYGbVf38dFeSCoRJrDGdgB6KCeemGK0S/AAyNA4eK94sicxw7YPAoK2i00shIW6Jn9Q8AfyO2kfcGRi1sLpaFQJXXIXKQ1zM5k96mij1ENsnbJhaE2AwMiFE8gB6s5P9EpjU/uUlc8Fc+o68qwB+Y/DEDf44VEtqG2IlNyaalNZWF3Q0r+ZJzg3WtvAiCh+S4:2:3c; fptctx2=taBcrIH61PuCVH7eNCyH0AHEYHVht29NHm46S5qgUjaemqS3jYiRtM%252b32r7GgyQMKRHkXyLfZyqMGqk50NQ5OH0RhGXkYUJDZFa5MNMn1Z5CNYLU3f4NiGT39H7cM8yL4Nc7q9QNIuwtpEQSg%252fkPjCfgEvnEiFShNTkKHMNjCOTI2F4m8dE7S%252fRqntm19pAkhb51jLjkNvQI4Bvhs77hkTbyMoY%252fz2XaCmOlmtddfMteKxBJdfk%252bZoFS%252b2SNcJsKmurGOeqPIX7m4Dq6zYXRkPl1w9QT1F5%252f3yWf8ZuWIAU1u43FMlxRuCjy4iuzGHgGBOi5UJ6u4vOkUbUc%252bPHjjQ%253d%253d; ai_session=ZmdwqBYcNrG0HncT0ArUHn|1744357341050|1744358271442; _px3=676af8a59f90194f651554920cfb9c39e5c7d3091126cb931496dc1a575d36f9:09z1QlHfycgAc2hnN/+7AG2uMSUe3KiyyNPkuoA8ufx0fkoJP+FpZelBAuENPXB0rW7dOWguvyqB78eKcL5Ulg==:1000:LBsn9w+OTIyzY+amlZz7Zpjnv23ZiHe+b4q0zkNNXVRrdQSUrDO5GzEz8FKQpYrczmCZgU0hYvim8bggDjZePtEG+dC887BwGMkV8gO2l+lSNgUg6ngkeZC5rcvbHkG8+eBkSWYwD4aqnRFDG3+wKxcrHm9XJyvZEe+rSqiclcWt1Rf9WPF73Xsubn3SamlMIvnS6LKUWkhv/79WT+wYgy/aHssNbKK4yvek7wCfXOY=; _pxde=44adbd05045173fbd645e4d8ed30db93e18e7e6b46f5d953dcfd1caa47b2b814:eyJ0aW1lc3RhbXAiOjE3NDQzNTgyNzM1NjAsImZfa2IiOjAsImluY19pZCI6WyI1Y2FmZGUzMzBmNDgxYjY5MjU3M2QwNmNmMmU2OWY5NyJdfQ==',
                    'priority': 'u=0, i',
                    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
                }
            });

            const location = res.headers['location'];
            if (!location) throw new Error('Redirect location not found in headers');

            const url = new URL(location);
            const uaid = url.searchParams.get('uaid');

            if (!uaid) throw new Error('uaid parameter not found in redirect URL');

            return uaid;
        } catch (error) {
            console.error('Failed to extract uaid from redirect:', error.message);
            throw error;
        }
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
    async evaluateExperimentAssignments({ correlationid, hpgid, canary }) {
        try {
            const url = '/API/EvaluateExperimentAssignments';
            const payload = {
                clientExperiments: [
                    {
                        parallax: 'addprivatebrowsingtexttofabricfooter',
                        control: 'addprivatebrowsingtexttofabricfooter_control',
                        treatments: ['addprivatebrowsingtexttofabricfooter_treatment']
                    },
                    {
                        parallax: 'updateuseformsubmissionfocuslogic',
                        control: 'updateuseformsubmissionfocuslogic_control',
                        treatments: ['updateuseformsubmissionfocuslogic_treatment']
                    },
                    {
                        parallax: 'loadgamepadnavigationmoduleloginfluent',
                        control: 'loadgamepadnavigationmoduleloginfluent_control',
                        treatments: ['loadgamepadnavigationmoduleloginfluent_treatment']
                    }
                ]
            };

            const res = await this.client.post(url, payload, {
                headers: {
                    'accept': 'application/json',
                    'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                    'canary': canary,
                    'client-request-id': correlationid,
                    'content-type': 'application/json; charset=utf-8',
                    'correlationid': correlationid,
                    'hpgact': '0',
                    'hpgid': String(hpgid),
                    'origin': 'https://signup.live.com',
                    'priority': 'u=1, i',
                    'referer': `https://signup.live.com/signup?lic=1&uaid=${correlationid}`,
                    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
                }
            });

            return res.data;
        } catch (error) {
            console.error('Failed to evaluate experiment assignments:', error.message);
            throw error;
        }
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

        const uaid = await this.extractUaidFromRedirect();

        // 2. uaid + flavor + canary + etc.
        const sd = await this._getUaId(uaid);

        sd.apiCanary = decodeUrl(sd.apiCanary)

        const data = await this.evaluateExperimentAssignments({
            correlationid:  uaid,
            hpgid: sd.hpgid,
            canary: sd.apiCanary
        })

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
