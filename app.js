/**
 * DASHBOARD DHT11 - LABORATÓRIO DE ELETRÔNICA
 * Comunicação Web Serial API + Processamento e Visualização de Dados
 */

// =====================================================================
// ESTADO GLOBAL DA APLICAÇÃO
// =====================================================================
const state = {
  port: null,
  reader: null,
  readableStreamClosed: null,
  keepReading: false,
  isConnected: false,
  isSimulating: false,
  simulationInterval: null,
  
  // Gráfico e Dados
  chart: null,
  isChartPaused: false,
  maxDataPoints: 30,
  
  // Histórico de Amostras
  history: [],
  sampleCount: 0,
  
  tempStats: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
  humStats: { min: Infinity, max: -Infinity, sum: 0, count: 0 }
};

// =====================================================================
// ELEMENTOS DO DOM
// =====================================================================
const elements = {
  btnConnect: document.getElementById('btnConnect'),
  btnDisconnect: document.getElementById('btnDisconnect'),
  btnSimulation: document.getElementById('btnSimulation'),
  baudRateSelect: document.getElementById('baudRateSelect'),
  connectionBadge: document.getElementById('connectionBadge'),
  connectionText: document.getElementById('connectionText'),
  serialWarning: document.getElementById('serialWarning'),

  // Valores de Temperatura
  tempValue: document.getElementById('tempValue'),
  tempGaugeFill: document.getElementById('tempGaugeFill'),
  tempStatusBadge: document.getElementById('tempStatusBadge'),
  tempMin: document.getElementById('tempMin'),
  tempAvg: document.getElementById('tempAvg'),
  tempMax: document.getElementById('tempMax'),
  tempDiagnostic: document.getElementById('tempDiagnostic'),

  // Valores de Umidade
  humValue: document.getElementById('humValue'),
  humGaugeFill: document.getElementById('humGaugeFill'),
  humStatusBadge: document.getElementById('humStatusBadge'),
  humMin: document.getElementById('humMin'),
  humAvg: document.getElementById('humAvg'),
  humMax: document.getElementById('humMax'),
  humDiagnostic: document.getElementById('humDiagnostic'),

  // Cálculos
  heatIndexValue: document.getElementById('heatIndexValue'),
  dewPointValue: document.getElementById('dewPointValue'),
  comfortBox: document.getElementById('comfortBox'),
  comfortIcon: document.getElementById('comfortIcon'),
  comfortTitle: document.getElementById('comfortTitle'),
  comfortDetail: document.getElementById('comfortDetail'),
  samplesCounter: document.getElementById('samplesCounter'),

  // Terminal e Gráficos
  terminalWindow: document.getElementById('terminalWindow'),
  autoScrollCheck: document.getElementById('autoScrollCheck'),
  btnClearTerminal: document.getElementById('btnClearTerminal'),
  rxLed: document.getElementById('rxLed'),
  btnPauseChart: document.getElementById('btnPauseChart'),
  btnClearData: document.getElementById('btnClearData'),
  btnExportCSV: document.getElementById('btnExportCSV'),

  // Modal Guia
  btnOpenDocs: document.getElementById('btnOpenDocs'),
  btnCloseDocs: document.getElementById('btnCloseDocs'),
  docsModal: document.getElementById('docsModal'),
  btnCopyCode: document.getElementById('btnCopyCode'),
  arduinoSourceCode: document.getElementById('arduinoSourceCode')
};

// =====================================================================
// INICIALIZAÇÃO
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  initCompatibilityCheck();
  initChart();
  setupEventListeners();
});

// Verifica suporte à Web Serial API
function initCompatibilityCheck() {
  if (!('serial' in navigator)) {
    elements.serialWarning.classList.remove('hidden');
    elements.btnConnect.disabled = true;
    elements.btnConnect.title = "Navegador incompatível com Web Serial API";
    elements.btnConnect.style.opacity = '0.5';
    elements.btnConnect.style.cursor = 'not-allowed';
  }
}

// =====================================================================
// CONFIGURAÇÃO DO GRÁFICO (Chart.js)
// =====================================================================
function initChart() {
  const ctx = document.getElementById('dhtChart').getContext('2d');
  
  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: [],
          borderColor: '#ff6b4a',
          backgroundColor: 'rgba(255, 107, 74, 0.1)',
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ff6b4a',
          yAxisID: 'yTemp'
        },
        {
          label: 'Umidade (%)',
          data: [],
          borderColor: '#00d2ff',
          backgroundColor: 'rgba(0, 210, 255, 0.08)',
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#00d2ff',
          yAxisID: 'yHum'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 350
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: '#cbd5e1',
            font: { family: 'Inter', size: 12, weight: 600 },
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', font: { family: 'Fira Code', size: 10 } }
        },
        yTemp: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Temperatura (°C)',
            color: '#ff6b4a',
            font: { weight: 600 }
          },
          min: 0,
          max: 50,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#ff6b4a', font: { family: 'Fira Code', size: 10 } }
        },
        yHum: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Umidade (%)',
            color: '#00d2ff',
            font: { weight: 600 }
          },
          min: 0,
          max: 100,
          grid: { drawOnChartArea: false },
          ticks: { color: '#00d2ff', font: { family: 'Fira Code', size: 10 } }
        }
      }
    }
  });
}

// =====================================================================
// GERENCIAMENTO DA CONEXÃO WEB SERIAL
// =====================================================================
async function connectSerial() {
  try {
    const baudRate = parseInt(elements.baudRateSelect.value, 10);
    
    // Solicita ao usuário selecionar uma porta COM
    state.port = await navigator.serial.requestPort();
    
    // Abre a porta com os parâmetros selecionados
    await state.port.open({ baudRate: baudRate });
    
    state.isConnected = true;
    updateConnectionUI('connected', 'Conectado (COM)');
    elements.btnConnect.classList.add('hidden');
    elements.btnDisconnect.classList.remove('hidden');
    elements.baudRateSelect.disabled = true;

    // Se a simulação estava rodando, desativa
    if (state.isSimulating) toggleSimulation(false);

    logTerminal(`Conectado à porta serial com taxa de ${baudRate} bps.`, 'sys');

    // Inicia o loop contínuo de leitura
    readSerialStream();

  } catch (err) {
    console.error('Erro ao conectar à porta COM:', err);
    if (err.name !== 'NotFoundError') {
      logTerminal(`Erro de conexão: ${err.message}`, 'err');
      alert(`Não foi possível abrir a porta COM.\n\nDetalhes: ${err.message}\nCertifique-se de fechar o Monitor Serial da IDE do Arduino!`);
    }
  }
}

async function readSerialStream() {
  state.keepReading = true;

  while (state.port && state.port.readable && state.keepReading) {
    const textDecoder = new TextDecoderStream();
    state.readableStreamClosed = state.port.readable.pipeTo(textDecoder.writable);
    state.reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
      while (true) {
        const { value, done } = await state.reader.read();
        if (done) {
          break; // O leitor foi cancelado
        }
        if (value) {
          flashRxLed();
          buffer += value;
          
          // Processa as quebras de linha enviadas pelo Arduino (\n ou \r\n)
          const lines = buffer.split(/\r?\n/);
          // O último elemento pode estar incompleto, mantém no buffer
          buffer = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 0) {
              handleIncomingLine(trimmed);
            }
          }
        }
      }
    } catch (error) {
      if (state.keepReading) {
        console.error('Erro de leitura serial:', error);
        logTerminal(`Erro no fluxo de leitura: ${error.message}`, 'err');
      }
    } finally {
      state.reader.releaseLock();
    }
  }
}

async function disconnectSerial() {
  state.keepReading = false;

  if (state.reader) {
    try {
      await state.reader.cancel();
      if (state.readableStreamClosed) {
        await state.readableStreamClosed.catch(() => {});
      }
    } catch (e) {
      console.warn('Erro ao cancelar leitor:', e);
    }
    state.reader = null;
  }

  if (state.port) {
    try {
      await state.port.close();
    } catch (e) {
      console.warn('Erro ao fechar porta:', e);
    }
    state.port = null;
  }

  state.isConnected = false;
  updateConnectionUI('disconnected', 'Desconectado');
  elements.btnConnect.classList.remove('hidden');
  elements.btnDisconnect.classList.add('hidden');
  elements.baudRateSelect.disabled = false;

  logTerminal('Porta serial desconectada.', 'sys');
}

// =====================================================================
// PARSER & PROCESSAMENTO DE DADOS
// =====================================================================
/**
 * Trata o formato enviado pelo Arduino:
 * "Umidade: 15.40 % | Temperatura: 1.00 ºC"
 */
function handleIncomingLine(rawLine) {
  // Regex flexível para umidade e temperatura (aceita variações de espaçamento, ºC e °C, vírgula ou ponto)
  const regex = /Umidade:\s*([\d.,]+)\s*%\s*\|\s*Temperatura:\s*([+-]?[\d.,]+)\s*[º°]C/i;
  const match = rawLine.match(regex);

  if (match) {
    const hum = parseFloat(match[1].replace(',', '.'));
    const temp = parseFloat(match[2].replace(',', '.'));

    if (!isNaN(hum) && !isNaN(temp)) {
      logTerminal(rawLine, 'parsed');
      processSensorData(temp, hum);
      return;
    }
  }

  // Linha recebida que não combina com o padrão esperado (ex: mensagens de inicialização do Arduino)
  logTerminal(rawLine, 'raw');
}

function processSensorData(temp, hum) {
  state.sampleCount++;
  elements.samplesCounter.textContent = state.sampleCount;

  // Atualiza Valores Principais nos Cartões
  elements.tempValue.textContent = temp.toFixed(1);
  elements.humValue.textContent = hum.toFixed(1);

  // Atualiza Barra Analógica
  // Faixa Temp: 0 a 50°C
  const tempPercent = Math.min(Math.max((temp / 50) * 100, 0), 100);
  elements.tempGaugeFill.style.width = `${tempPercent}%`;

  // Faixa Hum: 0 a 100%
  const humPercent = Math.min(Math.max(hum, 0), 100);
  elements.humGaugeFill.style.width = `${humPercent}%`;

  // Atualiza Estatísticas
  updateStats(temp, hum);

  // Diagnósticos Didáticos
  updateDiagnostics(temp, hum);

  // Cálculos Científicos (Sensação Térmica e Ponto de Orvalho)
  const heatIndex = calculateHeatIndex(temp, hum);
  const dewPoint = calculateDewPoint(temp, hum);

  elements.heatIndexValue.textContent = `${heatIndex.toFixed(1)} °C`;
  elements.dewPointValue.textContent = `${dewPoint.toFixed(1)} °C`;

  // Análise de Conforto Térmico Humano
  updateComfortStatus(temp, hum, heatIndex);

  // Armazena no Histórico
  const now = new Date();
  const timeLabel = now.toTimeString().split(' ')[0];
  
  const sampleEntry = {
    timestamp: now.toISOString(),
    timeLabel: timeLabel,
    temperature: temp,
    humidity: hum,
    heatIndex: heatIndex,
    dewPoint: dewPoint
  };
  state.history.push(sampleEntry);

  // Atualiza Gráfico
  if (!state.isChartPaused && state.chart) {
    addChartData(timeLabel, temp, hum);
  }
}

// Atualiza Mínimo, Máximo e Média
function updateStats(temp, hum) {
  // Temperatura
  state.tempStats.min = Math.min(state.tempStats.min, temp);
  state.tempStats.max = Math.max(state.tempStats.max, temp);
  state.tempStats.sum += temp;
  state.tempStats.count++;
  const tempAvg = state.tempStats.sum / state.tempStats.count;

  elements.tempMin.textContent = `${state.tempStats.min.toFixed(1)}°`;
  elements.tempMax.textContent = `${state.tempStats.max.toFixed(1)}°`;
  elements.tempAvg.textContent = `${tempAvg.toFixed(1)}°`;

  // Umidade
  state.humStats.min = Math.min(state.humStats.min, hum);
  state.humStats.max = Math.max(state.humStats.max, hum);
  state.humStats.sum += hum;
  state.humStats.count++;
  const humAvg = state.humStats.sum / state.humStats.count;

  elements.humMin.textContent = `${state.humStats.min.toFixed(1)}%`;
  elements.humMax.textContent = `${state.humStats.max.toFixed(1)}%`;
  elements.humAvg.textContent = `${humAvg.toFixed(1)}%`;
}

// Diagnósticos de Temperatura e Umidade
function updateDiagnostics(temp, hum) {
  // Temperatura
  if (temp < 18) {
    elements.tempStatusBadge.textContent = 'Frio';
    elements.tempStatusBadge.style.color = '#38bdf8';
    elements.tempDiagnostic.textContent = 'Temperatura abaixo da faixa ideal de conforto térmico.';
  } else if (temp <= 26) {
    elements.tempStatusBadge.textContent = 'Agradável';
    elements.tempStatusBadge.style.color = '#34d399';
    elements.tempDiagnostic.textContent = 'Temperatura ideal de conforto térmico em ambientes fechados.';
  } else if (temp <= 32) {
    elements.tempStatusBadge.textContent = 'Quente';
    elements.tempStatusBadge.style.color = '#f59e0b';
    elements.tempDiagnostic.textContent = 'Ambiente aquecido. Recomenda-se ventilação.';
  } else {
    elements.tempStatusBadge.textContent = 'Muito Quente';
    elements.tempStatusBadge.style.color = '#ef4444';
    elements.tempDiagnostic.textContent = 'Atenção: Risco de estresse térmico para pessoas e circuitos!';
  }

  // Umidade
  if (hum < 30) {
    elements.humStatusBadge.textContent = 'Ar Seco';
    elements.humStatusBadge.style.color = '#f59e0b';
    elements.humDiagnostic.textContent = 'Alerta de baixa umidade (favorece eletricidade estática ESD e ressecamento).';
  } else if (hum <= 60) {
    elements.humStatusBadge.textContent = 'Ideal';
    elements.humStatusBadge.style.color = '#34d399';
    elements.humDiagnostic.textContent = 'Faixa recomendada pela OMS (Organização Mundial da Saúde).';
  } else if (hum <= 80) {
    elements.humStatusBadge.textContent = 'Úmido';
    elements.humStatusBadge.style.color = '#38bdf8';
    elements.humDiagnostic.textContent = 'Ambiente com alta umidade relativa.';
  } else {
    elements.humStatusBadge.textContent = 'Saturado';
    elements.humStatusBadge.style.color = '#8b5cf6';
    elements.humDiagnostic.textContent = 'Risco iminente de condensação e oxidação de componentes eletrônicos!';
  }
}

// =====================================================================
// CÁLCULOS PSICROMÉTRICOS DIDÁTICOS
// =====================================================================

/**
 * Ponto de Orvalho (Dew Point) via Equação de Magnus-Tetens
 */
function calculateDewPoint(temp, hum) {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(hum / 100.0);
  const dewPoint = (b * alpha) / (a - alpha);
  return dewPoint;
}

/**
 * Sensação Térmica (Heat Index) via Fórmula do Serviço Meteorológico Nacional (NOAA / Rothfusz)
 */
function calculateHeatIndex(tempC, hum) {
  // Se estiver abaixo de 20°C, a sensação térmica é praticamente a própria temperatura
  if (tempC < 20) return tempC;

  // Conversão para Fahrenheit para aplicação direta da fórmula de Rothfusz
  const T = (tempC * 9 / 5) + 32;
  const R = hum;

  let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094));

  if (HI >= 80) {
    HI = -42.379 + 2.04901523 * T + 10.14333127 * R
         - 0.22475541 * T * R - 0.00683783 * T * T
         - 0.05481717 * R * R + 0.00122874 * T * T * R
         + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;

    if (R < 13 && T >= 80 && T <= 112) {
      const adjustment = ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      HI -= adjustment;
    } else if (R > 85 && T >= 80 && T <= 87) {
      const adjustment = ((R - 85) / 10) * ((87 - T) / 5);
      HI += adjustment;
    }
  }

  // Converte de volta para Celsius
  return (HI - 32) * 5 / 9;
}

// Avaliação de Conforto Térmico Humano
function updateComfortStatus(temp, hum, heatIndex) {
  if (temp >= 20 && temp <= 26 && hum >= 40 && hum <= 65) {
    elements.comfortBox.style.background = 'rgba(16, 185, 129, 0.12)';
    elements.comfortBox.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    elements.comfortIcon.innerHTML = '<i class="fa-solid fa-face-smile"></i>';
    elements.comfortIcon.style.color = '#10b981';
    elements.comfortTitle.textContent = 'Condições Ideais de Conforto';
    elements.comfortDetail.textContent = 'Temperatura e umidade excelentes para produtividade, estudo e saúde.';
  } else if (hum < 30) {
    elements.comfortBox.style.background = 'rgba(245, 158, 11, 0.12)';
    elements.comfortBox.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    elements.comfortIcon.innerHTML = '<i class="fa-solid fa-wind"></i>';
    elements.comfortIcon.style.color = '#f59e0b';
    elements.comfortTitle.textContent = 'Ambiente Ressecado';
    elements.comfortDetail.textContent = 'Atenção à hidratação e cuidado com descargas eletrostáticas em bancadas.';
  } else if (heatIndex > 32) {
    elements.comfortBox.style.background = 'rgba(239, 68, 68, 0.12)';
    elements.comfortBox.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    elements.comfortIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    elements.comfortIcon.style.color = '#ef4444';
    elements.comfortTitle.textContent = 'Calor Excessivo';
    elements.comfortDetail.textContent = 'Sensação térmica elevada. Necessário ar-condicionado ou circulação de ar.';
  } else {
    elements.comfortBox.style.background = 'rgba(56, 189, 248, 0.12)';
    elements.comfortBox.style.borderColor = 'rgba(56, 189, 248, 0.3)';
    elements.comfortIcon.innerHTML = '<i class="fa-solid fa-cloud"></i>';
    elements.comfortIcon.style.color = '#38bdf8';
    elements.comfortTitle.textContent = 'Ambiente Estável';
    elements.comfortDetail.textContent = `Sensação de ${heatIndex.toFixed(1)}°C com ${hum.toFixed(0)}% de umidade relativa.`;
  }
}

// =====================================================================
// ATUALIZAÇÃO DO GRÁFICO TEMPORAL
// =====================================================================
function addChartData(label, temp, hum) {
  state.chart.data.labels.push(label);
  state.chart.data.datasets[0].data.push(temp);
  state.chart.data.datasets[1].data.push(hum);

  // Mantém apenas os últimos N pontos para não sobrecarregar
  if (state.chart.data.labels.length > state.maxDataPoints) {
    state.chart.data.labels.shift();
    state.chart.data.datasets[0].data.shift();
    state.chart.data.datasets[1].data.shift();
  }

  state.chart.update('none'); // Update sem recalcular toda a animação para melhor desempenho
}

// =====================================================================
// TERMINAL SERIAL UART & LOGS
// =====================================================================
function logTerminal(message, type = 'raw') {
  const line = document.createElement('div');
  line.className = 'terminal-line';

  const timeStr = new Date().toLocaleTimeString();
  const timeSpan = `<span class="t-time">[${timeStr}]</span>`;

  if (type === 'parsed') {
    line.innerHTML = `${timeSpan} <span class="t-parsed">&lt;RX&gt; ${escapeHtml(message)}</span>`;
  } else if (type === 'sys') {
    line.innerHTML = `${timeSpan} <span class="cmd-info">&lt;SYS&gt; ${escapeHtml(message)}</span>`;
  } else if (type === 'err') {
    line.className += ' error-line';
    line.innerHTML = `${timeSpan} &lt;ERR&gt; ${escapeHtml(message)}`;
  } else {
    line.innerHTML = `${timeSpan} <span>${escapeHtml(message)}</span>`;
  }

  elements.terminalWindow.appendChild(line);

  // Rola até o final se o Auto-Scroll estiver ativado
  if (elements.autoScrollCheck.checked) {
    elements.terminalWindow.scrollTop = elements.terminalWindow.scrollHeight;
  }

  // Limite máximo de linhas na tela para evitar uso de memória excessivo
  if (elements.terminalWindow.children.length > 250) {
    elements.terminalWindow.removeChild(elements.terminalWindow.firstChild);
  }
}

function flashRxLed() {
  elements.rxLed.classList.add('active');
  setTimeout(() => {
    elements.rxLed.classList.remove('active');
  }, 120);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

// =====================================================================
// MODO DE SIMULAÇÃO DIDÁTICA (Sem necessidade de Hardware)
// =====================================================================
let simTemp = 24.5;
let simHum = 55.0;

function toggleSimulation(forceState) {
  const shouldSimulate = (typeof forceState === 'boolean') ? forceState : !state.isSimulating;

  if (shouldSimulate) {
    // Se a porta COM real estava aberta, fecha
    if (state.isConnected) {
      disconnectSerial();
    }

    state.isSimulating = true;
    updateConnectionUI('simulated', 'Modo Simulação');
    elements.btnSimulation.innerHTML = '<i class="fa-solid fa-stop"></i> Parar Simulação';
    elements.btnSimulation.classList.replace('btn-secondary', 'btn-danger');

    logTerminal('Modo de Simulação ativado. Gerando leituras DHT11 periódicas...', 'sys');

    // Gera uma leitura a cada 2 segundos (tempo característico do DHT11)
    state.simulationInterval = setInterval(() => {
      // Simula uma pequena variação natural
      simTemp += (Math.random() - 0.48) * 0.4;
      simHum += (Math.random() - 0.49) * 0.8;

      // Limites físicos de teste
      simTemp = Math.max(16, Math.min(38, simTemp));
      simHum = Math.max(25, Math.min(85, simHum));

      // Formato idêntico ao gerado pelo Arduino
      const simulatedRaw = `Umidade: ${simHum.toFixed(2)} % | Temperatura: ${simTemp.toFixed(2)} ºC`;
      flashRxLed();
      handleIncomingLine(simulatedRaw);
    }, 2000);

  } else {
    state.isSimulating = false;
    clearInterval(state.simulationInterval);
    state.simulationInterval = null;

    updateConnectionUI('disconnected', 'Desconectado');
    elements.btnSimulation.innerHTML = '<i class="fa-solid fa-play"></i> Modo Simulação';
    elements.btnSimulation.classList.replace('btn-danger', 'btn-secondary');

    logTerminal('Modo de Simulação encerrado.', 'sys');
  }
}

// =====================================================================
// ATUALIZAÇÃO DA UI DE CONEXÃO
// =====================================================================
function updateConnectionUI(statusClass, label) {
  elements.connectionBadge.className = `status-indicator-badge ${statusClass}`;
  elements.connectionText.textContent = label;
}

// =====================================================================
// EXPORTAÇÃO DE DADOS (CSV PARA RELATÓRIOS DO SENAI)
// =====================================================================
function exportCSV() {
  if (state.history.length === 0) {
    alert('Nenhum dado coletado para exportar ainda!');
    return;
  }

  let csv = 'Timestamp,Hora,Temperatura_C,Umidade_Porcento,Sensacao_Termica_C,Ponto_Orvalho_C\n';
  state.history.forEach(item => {
    csv += `${item.timestamp},${item.timeLabel},${item.temperature.toFixed(2)},${item.humidity.toFixed(2)},${item.heatIndex.toFixed(2)},${item.dewPoint.toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dht11_dados_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logTerminal(`Arquivo CSV exportado com sucesso (${state.history.length} amostras).`, 'sys');
}

// =====================================================================
// EVENT LISTENERS E CONTROLES
// =====================================================================
function setupEventListeners() {
  // Botões de Conexão
  elements.btnConnect.addEventListener('click', connectSerial);
  elements.btnDisconnect.addEventListener('click', disconnectSerial);
  elements.btnSimulation.addEventListener('click', () => toggleSimulation());

  // Limpar Terminal
  elements.btnClearTerminal.addEventListener('click', () => {
    elements.terminalWindow.innerHTML = '';
    logTerminal('Terminal limpo pelo usuário.', 'sys');
  });

  // Pausar / Retomar Gráfico
  elements.btnPauseChart.addEventListener('click', () => {
    state.isChartPaused = !state.isChartPaused;
    if (state.isChartPaused) {
      elements.btnPauseChart.innerHTML = '<i class="fa-solid fa-play"></i> Continuar';
      elements.btnPauseChart.classList.add('btn-primary');
    } else {
      elements.btnPauseChart.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar';
      elements.btnPauseChart.classList.remove('btn-primary');
    }
  });

  // Limpar Dados do Gráfico
  elements.btnClearData.addEventListener('click', () => {
    if (confirm('Deseja realmente limpar todo o histórico e reiniciar as estatísticas?')) {
      state.history = [];
      state.sampleCount = 0;
      elements.samplesCounter.textContent = '0';

      state.tempStats = { min: Infinity, max: -Infinity, sum: 0, count: 0 };
      state.humStats = { min: Infinity, max: -Infinity, sum: 0, count: 0 };

      elements.tempMin.textContent = '--';
      elements.tempMax.textContent = '--';
      elements.tempAvg.textContent = '--';
      elements.humMin.textContent = '--';
      elements.humMax.textContent = '--';
      elements.humAvg.textContent = '--';

      state.chart.data.labels = [];
      state.chart.data.datasets[0].data = [];
      state.chart.data.datasets[1].data = [];
      state.chart.update();

      logTerminal('Histórico de dados e gráficos reiniciados.', 'sys');
    }
  });

  // Exportar CSV
  elements.btnExportCSV.addEventListener('click', exportCSV);

  // Modal Guia Didático
  elements.btnOpenDocs.addEventListener('click', () => {
    elements.docsModal.classList.remove('hidden');
  });

  elements.btnCloseDocs.addEventListener('click', () => {
    elements.docsModal.classList.add('hidden');
  });

  // Fecha modal ao clicar fora
  elements.docsModal.addEventListener('click', (e) => {
    if (e.target === elements.docsModal) {
      elements.docsModal.classList.add('hidden');
    }
  });

  // Troca de Abas do Modal
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = `tab-${btn.dataset.tab}`;
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Copiar código Arduino
  elements.btnCopyCode.addEventListener('click', () => {
    const codeText = elements.arduinoSourceCode.innerText;
    navigator.clipboard.writeText(codeText).then(() => {
      elements.btnCopyCode.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
      setTimeout(() => {
        elements.btnCopyCode.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar Código';
      }, 2000);
    });
  });
}
