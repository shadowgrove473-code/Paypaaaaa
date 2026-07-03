
const PASSWORD_HASH = "c8f1e92c2e4e2e4d3c9f0b9e4a2d3f7b9e0c1a3b4d5e6f7a8b9c0d1e2f3a4b5";

const GIST_URL =
    "https://raw.githubusercontent.com/shadowgrove473-code/Paypaaaaa/refs/heads/main/members.txt";

let members = [];

/* === Проверка пароля === */
function checkPassword() {
    const input = document.getElementById('passInput').value.trim();
    const errorDiv = document.getElementById('wrongPass');

    const inputHash = CryptoJS.SHA256(input).toString();

    if (inputHash === PASSWORD_HASH) {
        errorDiv.style.display = 'none';
        document.getElementById('lockScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        loadMembersFromGithub();
    } else {
        errorDiv.style.display = 'block';
    }
}

document.getElementById('passInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') checkPassword();
});

/* === Переключение темы === */
document.getElementById('themeSwitch').addEventListener('change', function(e) {
    if (e.target.checked) {
        document.body.classList.add('light');
    } else {
        document.body.classList.remove('light');
    }
});

/* === Загрузка списка из GitHub === */
async function loadMembersFromGithub() {
    const tbody = document.getElementById('membersTable');
    const status = document.getElementById('syncStatus');
    const text = status.querySelector('span');

    status.classList.remove('ok', 'error');
    status.classList.add('syncing');
    text.textContent = "Синхронизация...";
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; opacity:0.8;'>Загрузка...</td></tr>";

    try {
        const response = await fetch(GIST_URL + "?nocache=" + Date.now());
        if (!response.ok) throw new Error("Ошибка сети");

        const raw = await response.text();
        const lines = raw.split(/\r?\n/);

        members = [];

        lines.forEach(line => {
            const clean = line.trim();
            if (!clean) return;
            const parts = clean.split(',');
            members.push({
                name: parts[0]?.trim() || "Сотрудник",
                staticId: parts[1]?.trim() || "0"
            });
        });

        renderTable();

        status.classList.remove('syncing', 'error');
        status.classList.add('ok');
        text.textContent = "✓ Синхронизировано";
    } catch (err) {
        status.classList.remove('syncing', 'ok');
        status.classList.add('error');
        text.textContent = "✗ Ошибка";
        tbody.innerHTML =
            "<tr><td colspan='5' style='text-align:center; color:#ff6b6b;'>Не удалось загрузить список.</td></tr>";
    }
}

/* === Отрисовка таблицы === */
function renderTable() {
    const tbody = document.getElementById('membersTable');
    tbody.innerHTML = "";

    if (members.length === 0) {
        tbody.innerHTML =
            "<tr><td colspan='5' style='text-align:center; opacity:0.8;'>Файл пуст.</td></tr>";
        return;
    }

    members.forEach((m, i) => {
        tbody.innerHTML += `
            <tr>
                <td><input type="checkbox" class="user-checkbox" data-index="${i}"></td>
                <td>${m.name}</td>
                <td><strong style="color:#5fd4ff;">${m.staticId}</strong></td>
                <td><input type="number" id="amount-${i}" placeholder="0"></td>
                <td><input type="text" id="comment-${i}" placeholder="Комментарий"></td>
            </tr>
        `;
    });
}

/* === Выделить всех === */
function toggleAll(master) {
    document.querySelectorAll('.user-checkbox')
        .forEach(cb => cb.checked = master.checked);
}

/* === Массовые действия === */
function applyMassActions() {
    const amount = document.getElementById('massAmount').value;
    const comment = document.getElementById('massComment').value;

    document.querySelectorAll('.user-checkbox').forEach(cb => {
        if (cb.checked) {
            const i = cb.dataset.index;
            if (amount) document.getElementById(`amount-${i}`).value = amount;
            if (comment) document.getElementById(`comment-${i}`).value = comment;
        }
    });
}

/* === Скачать файл === */
function downloadTxtFile() {
    let fileContent = "staticId;amount;comment\r\n";
    let count = 0;

    document.querySelectorAll('.user-checkbox').forEach(cb => {
        if (cb.checked) {
            const i = cb.dataset.index;
            const staticId = members[i].staticId;
            const amount = document.getElementById(`amount-${i}`).value.trim();
            const comment = document.getElementById(`comment-${i}`).value.trim() || "Приемка";

            if (amount && parseInt(amount) > 0) {
                fileContent += `${staticId};${amount};${comment}\r\n`;
                count++;
            }
        }
    });

    if (count === 0) return alert("Выберите людей и укажите сумму!");
    if (count > 100) return alert("Majestic принимает не более 100 человек за раз.");

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Приемка.txt";
    link.click();
    URL.revokeObjectURL(link.href);
}
