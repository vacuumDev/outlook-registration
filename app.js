import Outlook from "./src/outlook.js";
import Generator from "./src/generator.js";

const main = async () => {
    const outlook = new Outlook();

    // 1) Сначала подтягиваем ServerData
    const amsc = await outlook.fetchServerData();

    // 2) Генерируем тестовые данные
    const fakeInfo = Generator.generateFakeUserData();
    console.log('Generated user info:', fakeInfo);

    // 3) Пытаемся создать аккаунт
    const result = await outlook.createAccount(fakeInfo, amsc);
}

main();