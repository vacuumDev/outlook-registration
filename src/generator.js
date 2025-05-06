import { faker } from '@faker-js/faker';

export default class Generator {
    static generateFakeUserData(country) {
        const firstName = faker.name.firstName();
        const lastName  = faker.name.lastName();

        // Случайная дата рождения 18–60 лет назад
        const birthDateObj = faker.date.birthdate({ min: 18, max: 60, mode: 'age' });
        const dd = String(birthDateObj.getDate()).padStart(2, '0');
        const mm = String(birthDateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = birthDateObj.getFullYear();
        const birthDate = `${dd}:${mm}:${yyyy}`;

        // Логин: имя.фамилия + случайное число
        const memberNameLocal = `${firstName}.${lastName}${faker.number.int({ min: 1, max: 9999 })}`
            .toLowerCase();
        const memberName = `${memberNameLocal}@outlook.com`;

        // Надёжный пароль: длина 12, минимум одна буква верхнего/нижнего регистра, цифра и спецсимвол
        const password = faker.internet.password(12, false, /[A-Za-z0-9]/);


        return { birthDate, firstName, lastName, memberName, password, country };
    }

}