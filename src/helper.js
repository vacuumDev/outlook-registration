import config from "./config.js";
import axios from "axios";
import {HttpsProxyAgent} from "https-proxy-agent";
import {HttpProxyAgent} from "http-proxy-agent";


const minDelay = Math.floor(config.MIN_DELAY * 1000);
const maxDelay = Math.floor(config.MAX_DELAY * 1000);

export function getRandomElement(arr) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function generateRandom12Hex() {
    let hex = "";
    for (let i = 0; i < 12; i++) {
        hex += Math.floor(Math.random() * 16).toString(16);
    }
    return hex;
}

export async function getValidProxy() {
    let attempts = 0;
    let country = getRandomElement(config.COUNTRIES);

    while (attempts < 40) {
        attempts++;
        const proxyUrl = config.PROXY_URL
            .replace("{ID}", generateRandom12Hex())
            .replace("{COUNTRY}", country);

        console.log(proxyUrl)
        try {
            await axios.get("https://api.ipify.org?format=json", {
                httpsAgent: new HttpsProxyAgent(proxyUrl),
                httpAgent: new HttpProxyAgent(proxyUrl),
                timeout: 10000,
            });
            // Если ошибок нет – прокси рабочая
            return proxyUrl;
        } catch (error) {
            console.log(`Прокси ${proxyUrl} невалидна, пытаемся снова... (${attempts})`);
            await delay(getRandomInterval(minDelay, maxDelay));
        }
    }
    // Если не нашли валидный прокси
    return false;
}