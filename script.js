// script.js
const allowedCountries = ['australia', 'estonia', 'england', 'usa'];

window.onload = async () => {
  await loadCountries();
};

async function loadCountries() {
  try {
    const res = await fetch('https://5sim.net/v1/guest/prices?product=google');
    const data = await res.json();
    const select = document.getElementById('country');
    allowedCountries.forEach(c => {
      if (data[c] && data[c].google) {
        const option = document.createElement('option');
        option.value = c;
        option.innerText = c.charAt(0).toUpperCase() + c.slice(1);
        select.appendChild(option);
      }
    });
  } catch (err) {
    alert('Ошибка загрузки стран.');
  }
}

async function loadPrices() {
  const country = document.getElementById('country').value;
  const apiKey = document.getElementById('apiKey').value.trim();
  const priceDiv = document.getElementById('price');
  const balanceDiv = document.getElementById('balance');

  if (!apiKey) return;

  try {
    const priceRes = await fetch('https://5sim.net/v1/guest/prices?product=google');
    const priceData = await priceRes.json();
    const price = priceData[country]?.google?.cost || 'недоступно';
    priceDiv.innerText = price + ' ₽';
  } catch {
    priceDiv.innerText = 'Ошибка получения цены';
  }

  try {
    const balRes = await fetch('https://5sim.net/v1/user/profile', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const profile = await balRes.json();
    balanceDiv.innerText = profile.balance + ' ₽';
  } catch {
    balanceDiv.innerText = 'Ошибка получения баланса';
  }
}

async function buyNumbers() {
  const count = parseInt(document.getElementById('count').value);
  const country = document.getElementById('country').value;
  const apiKey = document.getElementById('apiKey').value.trim();
  const container = document.getElementById('numbers');
  container.innerHTML = '';

  if (!apiKey) {
    alert('Введите API ключ.');
    return;
  }

  for (let i = 0; i < count; i++) {
    try {
      const res = await fetch(`https://5sim.net/v1/user/buy/activation/${country}/google`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        container.innerHTML += `<div class="number-entry">Ошибка: ${error.message}</div>`;
        continue;
      }

      const data = await res.json();
      const number = `+${data.phone}`;

      const entry = document.createElement('div');
      entry.classList.add('number-entry');
      entry.innerHTML = `
        <strong>Номер:</strong> ${number}<br>
        <strong>ID:</strong> ${data.id}<br>
        <button onclick="copyToClipboard('${number}')">Скопировать номер</button>
        <div id="code-${data.id}">Ожидание кода...</div>
      `;
      container.appendChild(entry);

      checkCode(data.id, apiKey);
    } catch (err) {
      container.innerHTML += `<div class="number-entry">Ошибка: ${err.message}</div>`;
    }
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Скопировано: ' + text);
  });
}

async function checkCode(id, apiKey) {
  const resultDiv = document.getElementById(`code-${id}`);
  const interval = setInterval(async () => {
    const res = await fetch(`https://5sim.net/v1/user/check/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });
    const data = await res.json();
    if (data.sms && data.sms.length > 0) {
      const code = data.sms[0].code;
      resultDiv.innerHTML = `Код: <strong>${code}</strong> <button onclick="copyToClipboard('${code}')">Скопировать код</button>`;
      clearInterval(interval);
    }
  }, 5000);
}
