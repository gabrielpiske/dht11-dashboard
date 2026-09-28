# 🌡️ Dashboard Educativo DHT11 - Laboratório de Eletrônica & IoT

Aplicação web moderna, intuitiva e didática desenvolvida para aulas de eletrônica e sistemas microcontrolados (Arduino). O sistema conecta-se diretamente à porta serial USB do computador (COM) através da **Web Serial API** para receber, plotar e analisar em tempo real as leituras de temperatura e umidade do sensor **DHT11**.

---

## 🎯 Objetivo Didático
Proporcionar aos alunos uma experiência visual completa da ponte entre o mundo físico (sensores e microcontroladores) e o software (aplicações web em tempo real):
- **Comunicação Serial UART:** Compreensão de taxas de transmissão (Baud Rate: 9600 bps), fluxo de caracteres ASCII e quebras de linha (`\n`, `\r\n`).
- **Análise de Dados em Tempo Real:** Conversão de strings formatadas em grandezas físicas numéricas, cálculo de médias, máximas e mínimas.
- **Conceitos de Física & Psicrometria:** Cálculo do **Ponto de Orvalho** (fórmula de Magnus-Tetens) e **Sensação Térmica / Índice de Calor** (fórmula de Rothfusz / NOAA).
- **Geração de Relatórios de Laboratório:** Exportação de dados brutos para planilhas (CSV/Excel).

---

## 💻 Formato Serial Esperado
O sistema lê automaticamente a saída enviada pelo Arduino no seguinte formato:
```text
Umidade: 15.40 % | Temperatura: 1.00 ºC
```

O analisador (*parser*) em JavaScript utiliza expressões regulares tolerantes a variações de espaçamento, pontuação (ponto ou vírgula) e caracteres especiais (`°C` ou `ºC`).

---

## 🚀 Como Executar o Dashboard

### ⚠️ Requisito Importante para Conexão Serial USB
A **Web Serial API** (`navigator.serial`) é um recurso de segurança moderno presente nos navegadores **Google Chrome**, **Microsoft Edge** e **Opera**.

Por políticas de segurança dos navegadores, a comunicação serial direta **exige uma origem segura** (`localhost`, `127.0.0.1` ou `https://`). Se você abrir o arquivo dando dois cliques diretamente (`file://`), o navegador bloqueará o acesso às portas do computador.

### Opção 1: Via VS Code (Extensão Live Server) - *Recomendado para aulas*
1. Abra a pasta do projeto no **VS Code**.
2. Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.
3. O painel abrirá automaticamente em `http://127.0.0.1:5500`.

### Opção 2: Via Terminal (Python ou Node.js)
Se preferir rodar via linha de comando:
```bash
# Com Python 3:
python -m http.server 8000

# Ou com Node.js (npx):
npx serve
```
Abra o navegador em `http://localhost:8000`.

### Opção 3: Modo Simulação (Sem Arduino)
Caso esteja em um computador sem Arduino conectado ou em um navegador sem Web Serial API, basta clicar no botão **"Modo Simulação"** no cabeçalho do painel. O sistema gerará leituras virtuais realistas a cada 2 segundos para fins de demonstração e estudo da interface!

---

## 🔌 Ligação de Hardware (Arduino + DHT11)

| Pino DHT11 (Módulo 3 Pinos) | Pino DHT11 (Avulso 4 Pinos) | Arduino Uno / Nano |
| :--- | :--- | :--- |
| **VCC (+)** | Pino 1 (VCC) | **5V** ou **3.3V** |
| **Sinal (S / OUT)** | Pino 2 (DATA)* | **Pino Digital D2** |
| - | Pino 3 (NC) | *Não conectado* |
| **GND (-)** | Pino 4 (GND) | **GND** |

*\*Nota: Se você estiver usando o sensor avulso de 4 pinos, instale um resistor de pull-up de 10kΩ entre o pino DATA e o VCC.*

---

## 🛠️ Código Arduino (`arduino_dht11.ino`)
Para carregar na placa:
1. Abra a **Arduino IDE**.
2. Instale as bibliotecas **DHT sensor library** (da Adafruit) e **Adafruit Unified Sensor** pelo Gerenciador de Bibliotecas.
3. Abra o arquivo `arduino_dht11.ino` deste repositório e faça o upload para a placa.
4. **IMPORTANTE:** Feche o Monitor Serial da Arduino IDE antes de clicar em "Conectar Porta COM" no navegador (duas aplicações não podem usar a mesma porta COM simultaneamente).

---

## ✨ Funcionalidades do Dashboard
- **Termômetro e Higrômetro Digitais:** Indicadores numéricos gigantes, barras analógicas dinâmicas com transições suaves e badges de diagnóstico de conforto térmico.
- **Cálculo de Sensação Térmica e Ponto de Orvalho:** Implementação de equações psicrométricas em tempo real.
- **Gráfico Histórico Dinâmico:** Gráfico temporal duplo (temperatura e umidade) com Chart.js, suporte a pausa, limpeza e escala independente por eixo.
- **Monitor Serial UART Integrado:** Console em estilo terminal com marcações de timestamp, indicador LED de atividade (RX) e rolagem automática.
- **Exportação CSV:** Botão para download de planilha com todos os pontos medidos durante o experimento para relatórios técnicos.
- **Guia Didático e Esquemático Integrado:** Janela modal com pinagem, especificações elétricas, guia de resolução de problemas e botão para copiar o código Arduino com 1 clique.

---

## 📂 Estrutura de Arquivos
```text
dht11-dashboard/
├── index.html          # Interface visual semântica e acessível
├── style.css           # Estilização com Dark Tech Theme responsivo
├── app.js              # Lógica de conexão Web Serial, parsing e gráficos
├── arduino_dht11.ino   # Código pronto para upload no Arduino
└── README.md           # Documentação técnica e pedagógica
```

---
*Desenvolvido para apoio às aulas de Eletrônica, Automação e Internet das Coisas (IoT).*
