import {cleanEnv, str, url} from "envalid";

const env = cleanEnv(process.env, {
    EZ_CAPTCHA_KEY: str(),
    PROXY_URL: url({ protocols: ['http'] }),
    COUNTRIES: str(),
    MIN_DELAY: str(),
    MAX_DELAY: str(),
});


const config = {
    ...env,
    COUNTRIES: env.COUNTRIES.split(','),
    MIN_DELAY: Number(env.MIN_DELAY),
    MAX_DELAY: Number(env.MAX_DELAY)
};

export default config;