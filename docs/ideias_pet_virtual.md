# Documento de Requisitos de Produto (PRD) - MVP
**Projeto:** Web App Matemático (Motor OCR/CNN) + Bichinho Virtual
**Foco da Sprint:** MVP do Loop de Jogo e Hub do Quarto (Pixel Art Isométrica)

---

## 1. Visão Geral e Objetivos Macro
Integrar o motor de reconhecimento de imagem (CNN/OCR) existente com uma mecânica de retenção baseada em um "Bichinho Virtual". O objetivo principal é criar um hábito de estudo diário (retenção) atrelando a resolução de contas matemáticas à sobrevivência e bem-estar do pet virtual.
* **Estética visual:** O hub central (quarto) será em pixel art isométrica, garantindo leveza para o navegador.
* **Escopo restrito (MVP):** Funcionalidades de mapa de jornada e sistemas avançados de anti-trapaça complexos estão fora desta versão inicial.

---

## 2. O Loop Central de Estudo (Gameplay)
A sessão de estudo deve ser focada, minimalista e medir o tempo de forma justa, reduzindo a carga cognitiva da criança.

* **Start:** O fluxo começa no "Quarto do Pet" através de um botão "Começar".
* **Apresentação Isolada:** As 10 contas da lição devem aparecer na tela **uma de cada vez**.
* **Cronometragem Precisa:** * O relógio (invisível para a criança) inicia no exato momento em que a conta é renderizada.
  * O relógio para no exato milissegundo em que o botão "Enviar" (para a CNN) é acionado.
  * O tempo individual de cada resposta deve ser salvo no banco de dados para métricas pedagógicas.
* **Feedback Minimalista:** Zero overlays ou animações intrusivas na tela da conta. O app deve emitir apenas:
  * Um som agradável e curto para **Acerto**.
  * Um som distinto e suave para **Erro**.
* **Tela de Resultados:** Após a 10ª conta, exibir um sumário: Quantidade de acertos, tempo total, bônus adquiridos, total de moedas ganhas e um botão "Voltar para o Quarto".


## 4. Sistema de Pontuação e Economia
As recompensas em moedas são baseadas na dificuldade matemática e na velocidade de resolução (inferência via OCR local).

* **Tabela de Ganhos Base (por acerto):**
  * Conta Fácil (1 dígito + 1 dígito): **1 Moeda**
  * Conta Média (1 dígito + 2 dígitos): **3 Moedas**
  * Conta Difícil (1 dígito + 3 ou 4 dígitos): **5 Moedas**
* **Multiplicador de Velocidade:** O sistema precisa ter uma variável de "Tempo Alvo" para cada conta. Se o usuário resolver $\ge 7$ das 10 contas abaixo desse tempo alvo estipulado, o valor total de moedas daquela lição recebe um multiplicador de $x2$.

---

## 5. O Hub Central: Quarto e Bichinho Virtual
A tela principal do jogo, onde o saldo de moedas é gasto e o engajamento emocional acontece.

### 5.1. Estados do Pet (Time-based Decay)
O estado de saúde do pet é calculado pela diferença de tempo (`timestamp`) desde a **última alimentação ou hidratação**, e não pelo último login do usuário. O pet nunca morre.

| Estado | Condição de Tempo | Animação / Visual (Pixel Art) | Como Reverter |
| :--- | :--- | :--- | :--- |
| **Feliz** | 0 a 24 horas | Animado, ocioso alegre (idle). | Nenhuma ação necessária. |
| **Fome/Sede** | 24 a 48 horas | Estático, neutro, balão de pensamento pedindo água/comida. | Consumir 1 Água ou 1 Comida. |
| **Doente** | Mais de 48 horas | Deitado, triste, com termômetro ou curativo. | Consumir 1 Remédio. |

### 5.2. Loja e Consumo de Itens
Os itens são comprados com moedas e aplicados ao pet. 
* **Regra de Saciedade:** O pet deve recusar o consumo de itens se estiver com o status "Feliz".

| Item | Preço | Efeito no Pet |
| :--- | :--- | :--- |
| **Água** | 4 Moedas | Sacia a sede. Restaura o status para "Feliz" (se no estágio de 24-48h). |
| **Comida** | 6 Moedas | Sacia a fome. Restaura o status para "Feliz" (se no estágio de 24-48h). |
| **Remédio** | 20 Moedas | Cura a doença. Restaura o status imediatamente para "Feliz" (zera fome e sede junto). |

### 5.3. Sistema Anti-Frustração (Trava de Resgate)
Evitar a falência e abandono do app caso a criança fique muito tempo sem jogar e sem moedas.
* **Condição de Gatilho:** Se o pet estiver "Doente" E o saldo da carteira do usuário for `< 20 moedas`.
* **Ação:** Ao concluir a PRIMEIRA lição do dia (independente de acertos ou tempo), o sistema injeta um Remédio automaticamente no pet.
* **Mensagem:** "Seu pet foi curado com um kit de emergência!"

---

## 6. Sistema de Ofensivas (Streaks)
Incentivo de constância para o MVP.

* **Manutenção:** Completar e enviar pelo menos 1 lição completa no dia mantém a ofensiva (streak) ativa.
* **Recompensa de Marco:** Ao atingir exatamente **7 dias consecutivos**, o sistema desbloqueia um **Troféu** (asset de decoração em pixel art isométrica).
* **Posicionamento:** Este troféu passa a compor o cenário do quarto de forma permanente, servindo como registro visual da conquista.
