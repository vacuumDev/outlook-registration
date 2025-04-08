import axios from 'axios';

export default class Outlook {
    constructor() {
        // Базовый URL для всех запросов
        axios.defaults.baseURL = 'https://signup.live.com';

        // Общие заголовки для всех запросов
        axios.defaults.headers.common = {
            'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9',
            'Connection': 'keep-alive',
            'Content-Type': 'application/json; charset=utf-8',
            'Origin': 'https://signup.live.com',
            'Referer': 'https://signup.live.com/?lic=1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                'Chrome/135.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            // кастомные для CreateAccount
            'canary': '51BOOh7RcTfno2ZBh0ufgiNZcz9UinPxFh/JpIMZ45uZi2fnOBMmbc6Dwyh85cvddLB7BzzHMkJt4ZIkoarqBN/nvcaHD8ObELwl+flIlc+/H+X4EZMM0fCChMNjrI8HyNi64sEWwJSRQ61Qn8EF52GGpOnAUeBAg7vkTsXBFrnz+7Iao563Swfhz5D5hN6o0iIjGMGyutn6TTEoEu4wo5Cyz1rVjoSS+QGF5zSbYWmERGyJmudK6GvfW9c3CJci:2:3c',
            'client-request-id': '8b8f34a5e5274b1b857d8997b51a50bf',
            'correlationId': '8b8f34a5e5274b1b857d8997b51a50bf',
            'hpgact': '0',
        };

        // URL для создания аккаунта (подставится после fetchServerData)
        this.urlCreateAccount = null;

        // Параметры из ServerData
        this.hpgid = null;
        this.scid  = null;
        this.uaid  = null;
        this.uiflvr = null;
    }

    // Получаем и парсим ServerData из HTML
    async fetchServerData() {
        const res = await axios.get('/?lic=1');
        const match = res.data.match(/var ServerData\s*=\s*(\{[\s\S]*?\});/);
        if (!match) {
            throw new Error('ServerData не найден в HTML');
        }

        const serverData = JSON.parse(match[1]);

        // Сохраняем нужные поля
        this.urlCreateAccount = serverData.urlCreateAccount;
        this.hpgid  = serverData.hpgid;
        this.scid   = serverData.iScenarioId;
        this.uaid   = serverData.sUnauthSessionID;
        this.uiflvr = serverData.iUiFlavor;

        return res.headers["set-cookie"][0].split("=")[1].split(";")[0]
    }

    /**
     * Создать аккаунт Outlook
     * @param {Object} info
     * @param {string} info.birthDate   — формат "DD:MM:YYYY"
     * @param {string} info.firstName
     * @param {string} info.lastName
     * @param {string} info.memberName  — логин с @outlook.com
     * @param {string} info.password
     * @param {string} info.country     — например, "IL"
     */
    async createAccount(info, amsc) {
        // Если ещё не делали fetchServerData — сделаем
        if (!this.urlCreateAccount) {
            await this.fetchServerData();
        }

        axios.defaults.headers.common['Cookie'] = `amsc=${amsc}`

        const payload = {
            BirthDate: info.birthDate,
            CheckAvailStateMap: [`${info.memberName}:false`],
            Country: info.country,
            EvictionWarningShown: [],
            FirstName: info.firstName,
            IsRDM: false,
            IsOptOutEmailDefault: true,
            IsOptOutEmailShown: 1,
            IsOptOutEmail: true,
            IsUserConsentedToChinaPIPL: false,
            LastName: info.lastName,
            LW: 1,
            MemberName: info.memberName,
            RequestTimeStamp: new Date().toISOString(),
            ReturnUrl: '',
            SignupReturnUrl: '',
            SuggestedAccountType: 'EASI',
            SiteId: '',
            VerificationCodeSlt: '',
            PrivateAccessToken: '',
            WReply: '',
            MemberNameChangeCount: 1,
            MemberNameAvailableCount: 1,
            MemberNameUnavailableCount: 0,
            Password: info.password,
            uiflvr: this.uiflvr,
            scid: this.scid,
            uaid: this.uaid,
            hpgid: this.hpgid
        };

        const res = await axios.post(
            `${this.urlCreateAccount}?lic=1`,
            payload
        );
        return res.data;
    }
}
