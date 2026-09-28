/*
  =============================================================================
  PROJETO: Dashboard Educativo DHT11 (SENAI - Eletrônica & IoT)
  OBJETIVO: Leitura do sensor de temperatura e umidade DHT11 e envio via Serial
            no padrão reconhecido pelo Dashboard Web Serial.
  
  FORMATO SERIAL DE SAÍDA:
  "Umidade: 15.40 % | Temperatura: 1.00 ºC"

  CONEXÕES:
  - VCC: 5V ou 3.3V do Arduino
  - DATA (Sinal): Pino Digital 2 (com resistor pull-up 10k se for sensor avulso)
  - GND: Pino GND do Arduino
  =============================================================================
*/

#include <DHT.h>

// Definições de Pinos e Tipos
#define DHTPIN 2       // Pino digital do Arduino conectado ao DATA do DHT11
#define DHTTYPE DHT11  // Tipo do sensor utilizado

// Inicialização do objeto do sensor DHT
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  // Inicializa comunicação serial com velocidade de 9600 bps
  Serial.begin(9600);
  
  // Inicializa o sensor DHT11
  dht.begin();
  
  Serial.println(F("=========================================="));
  Serial.println(F(" SENAI - Modulo de Leitura DHT11 Iniciado "));
  Serial.println(F("=========================================="));
  delay(1500); // Aguarda 1.5s para estabilização de leitura do sensor
}

void loop() {
  // O sensor DHT11 requer um intervalo mínimo de 1 a 2 segundos entre leituras
  delay(2000);

  // Leitura da umidade relativa do ar em percentual (%)
  float umidade = dht.readHumidity();

  // Leitura da temperatura em graus Celsius (°C)
  float temperatura = dht.readTemperature();

  // Verificação de erro na leitura (se retornar NaN - Not a Number)
  if (isnan(umidade) || isnan(temperatura)) {
    Serial.println(F("Erro: Falha ao ler do sensor DHT11! Verifique as conexoes de fio e resistor."));
    return;
  }

  // Envio serial no formato do Dashboard:
  // "Umidade: 99.00 % Temperatura: 23.70 °C" (também aceita com '|')
  Serial.print(F("Umidade: "));
  Serial.print(umidade, 2);
  Serial.print(F(" % Temperatura: "));
  Serial.print(temperatura, 2);
  Serial.println(F(" °C"));
}
