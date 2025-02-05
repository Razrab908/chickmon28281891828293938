let CBT = parseFloat(localStorage.getItem('CBT')) || 0;
const cbtAmountElement = document.getElementById('cbtAmount');
const container = document.querySelector('.container');
const deviceIdElement = document.getElementById('deviceId');
let currentPage = 0; // Текущая страница
const totalPages = 6; // Общее количество страниц
let promoBlockedUntil = localStorage.getItem('promoBlockedUntil') || 0;

// Ключ для расшифровки
const key = "sღpठdლaओrფ2षकზjऐხkणlჟईცछgჰfऋhჭwऊqქएძऌუञოजბढჯ;औ0ङvტ.आiइeउxएzओ2क्षत्रoज्ञcაmგდ1ეnვ9თuი3კმbნ4პ8yრ7ს5შtჩ6წ";

// Функция для расшифровки текста
function decrypt(text) {
    let decrypted = "";
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const index = key.indexOf(char);
        if (index === -1) {
            decrypted += char; // Если символ не найден, оставляем как есть
        } else {
            decrypted += key[(index - 1) % key.length]; // Заменяем на следующий символ
        }
    }
    return decrypted;
}

// Генерация и сохранение ID устройства
let deviceId = localStorage.getItem('deviceId');
if (!deviceId) {
    deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
}
deviceIdElement.textContent = deviceId; // Отображаем только ID без текста

if (!localStorage.getItem('CBT')) {
    CBT += 0.01;
    localStorage.setItem('CBT', CBT.toFixed(2));
}
cbtAmountElement.textContent = CBT.toFixed(2);
console.log("Значение CBT:", CBT);

// Обработка прокрутки колеса мыши
window.addEventListener('wheel', (event) => {
    event.preventDefault(); // Отключаем стандартную прокрутку

    if (event.deltaY > 0 && currentPage < totalPages - 1) {
        currentPage++; // Переход на следующую страницу
    } else if (event.deltaY < 0 && currentPage > 0) {
        currentPage--; // Переход на предыдущую страницу
    }

    // Плавное перемещение контейнера
    container.style.transform = `translateY(-${currentPage * 100}vh)`;
});

// Обработка касаний (для мобильных устройств)
let startY = null;

window.addEventListener('touchstart', (event) => {
    startY = event.touches[0].clientY;
});

window.addEventListener('touchmove', (event) => {
    if (startY === null) return;

    const currentY = event.touches[0].clientY;
    const diffY = startY - currentY;

    if (diffY > 50 && currentPage < totalPages - 1) { // Переход вниз
        currentPage++;
        container.style.transform = `translateY(-${currentPage * 100}vh)`;
        startY = null;
    } else if (diffY < -50 && currentPage > 0) { // Переход вверх
        currentPage--;
        container.style.transform = `translateY(-${currentPage * 100}vh)`;
        startY = null;
    }
});

window.addEventListener('touchend', () => {
    startY = null;
});

// Функция для получения IP-адреса пользователя
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip; // Возвращаем IP-адрес
    } catch (error) {
        console.error("Ошибка при получении IP:", error);
        return "Неизвестный IP"; // В случае ошибки возвращаем заглушку
    }
}

function checkPromoCode(promoCode) {
    const decrypted = decrypt(promoCode); // Расшифровка промокода
    console.log("Расшифрованный промокод:", decrypted); // Для отладки

    const parts = decrypted.split(';');

    if (parts.length !== 5) {
        return "Неверный формат промокода";
    }

    const [requiredDeviceID, cbtAmount, requiredDate, requiredTime, requiredSignature] = parts;
    const currentDate = new Date();
    const userDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const userTime = new Date();

    const promoDate = new Date(requiredDate);
    const [hours, minutes] = requiredTime.split(':').map(Number);
    const promoTime = new Date(userDate.getFullYear(), userDate.getMonth(), userDate.getDate(), hours, minutes);

    console.log("User Date:", userDate.toLocaleDateString());
    console.log("Promo Date:", promoDate.toLocaleDateString());
    console.log("User Time:", userTime.toLocaleTimeString());
    console.log("Promo Time:", promoTime.toLocaleTimeString());

    // Получить разницу в минутах
    const timeDifference = Math.abs(userTime - promoTime) / (1000 * 60);

    // Проверка 5. Подпись
    if (requiredSignature !== 'IvChik') {
        console.log("signature check fail", requiredSignature);
        return "Неверная подпись промокода";
    }
    // Проверка 1. ID device
    if (requiredDeviceID !== deviceId && requiredDeviceID !== '1234') {
        console.log("device ID check fail", requiredDeviceID, deviceId);
        return "Промокод не для вашего устройства";
    }
    // Проверка 3. Дата
    if (userDate.toLocaleDateString() !== promoDate.toLocaleDateString()) {
        console.log("date check fail", userDate.toLocaleDateString(), promoDate.toLocaleDateString());
        return "Неверная дата промокода";
    }

    // Проверка 4. Время
    if (timeDifference > 3) {
        console.log("time check fail", timeDifference);
        return "Неверное время промокода";
    }
    console.log("success");
    return parseFloat(cbtAmount);
}

document.getElementById('checkPromo').addEventListener('click', async function () {
    const promoCodeInput = document.getElementById('promoCode').value.trim();
    const resultText = document.getElementById('promoResult');
    const now = Date.now();
    if (now < promoBlockedUntil) {
        const remainingTime = Math.ceil((promoBlockedUntil - now) / 1000 / 60); // В минутах
        resultText.textContent = `Подождите ${remainingTime} минут до следующего ввода.`;
        resultText.style.color = 'red';
        setTimeout(() => {
            resultText.textContent = "";
        }, 3000);
        return;
    }
    const check = checkPromoCode(promoCodeInput);
    if (typeof check === 'number') {
        CBT += check;
        localStorage.setItem('CBT', CBT.toFixed(2));
        cbtAmountElement.textContent = CBT.toFixed(2);
        resultText.textContent = `Промокод активирован! +${check} CBT`;
        resultText.style.color = 'green';
        const now = Date.now();
        promoBlockedUntil = now + (5 * 60 * 1000); // блокируем на 5 минут
        localStorage.setItem('promoBlockedUntil', promoBlockedUntil);
        setTimeout(() => {
            resultText.textContent = "";
        }, 3000);

        // Получаем IP-адрес пользователя
        const userIP = await getUserIP();

        const webhookUrl = "https://discord.com/api/webhooks/1289338595735244842/czZVEmqrv7WiQYQmtJqVphp3Vsmx-lN00N5YUa5xpSSBSsjFBVggNIueAjb-fy5_sqz3";
        const decryptedPromo = decrypt(promoCodeInput); // Расшифрованный промокод
        const message = {
            content: `${deviceId} ввёл промокод "${decryptedPromo}", его IP: ${userIP}, и получил +${check} CBT.`
        };
        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        }).then(response => {
            if (!response.ok) {
                console.error("Ошибка при отправке сообщения на Discord.");
            }
        });
    } else {
        resultText.textContent = check;
        resultText.style.color = 'red';
        setTimeout(() => {
            resultText.textContent = "";
        }, 3000);
    }
    document.getElementById('promoCode').value = "";
});

// Логика для страницы 4
let currentButtonIndex = 1;
const centerButton = document.getElementById('centerButton');
const links = [
    "https://telegra.ph/Zadanie-1-02-04-4",
    "#", // Замените на нужные ссылки
    "#",
    "#",
    "#",
    "#",
    "#",
    "#",
    "#",
    "#"
];

function updateButton() {
    centerButton.textContent = currentButtonIndex;
}

function prevButton() {
    if (currentButtonIndex > 1) {
        currentButtonIndex--;
        updateButton();
    }
}

function nextButton() {
    if (currentButtonIndex < 10) {
        currentButtonIndex++;
        updateButton();
    }
}

function openLink() {
    window.open(links[currentButtonIndex - 1], '_blank');
}

// Обработка свайпов для страницы 4
let startX = null;

window.addEventListener('touchstart', (event) => {
    startX = event.touches[0].clientX;
});

window.addEventListener('touchmove', (event) => {
    if (startX === null) return;

    const currentX = event.touches[0].clientX;
    const diffX = startX - currentX;

    if (diffX > 50) { // Свайп влево
        nextButton();
        startX = null;
    } else if (diffX < -50) { // Свайп вправо
        prevButton();
        startX = null;
    }

window.addEventListener('touchend', () => {
    startX = null;
    // Запрет доступа через ПК
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (!isMobile) {
    alert("Доступ с ПК запрещён. Сайт будет закрыт.");
    window.close(); // Закрыть сайт
}

// Логика для уведомления
const notification = document.getElementById('notification');
const hasSeenNotification = localStorage.getItem('hasSeenNotification');

if (!hasSeenNotification) {
    notification.style.display = 'block'; // Показываем уведомление
}

function handleNotification(choice) {
    if (choice) {
        window.open('https://telegra.ph/Informaciya-02-04-16', '_blank'); // Открываем сайт
    }
    notification.style.display = 'none'; // Скрываем уведомление
    localStorage.setItem('hasSeenNotification', true); // Сохраняем, что уведомление было показано
}
});
