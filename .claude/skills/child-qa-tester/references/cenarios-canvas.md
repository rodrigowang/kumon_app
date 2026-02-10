# Cenários de Teste: Canvas e OCR

O canvas de escrita é o coração do app. Ele precisa ser à prova de tudo.

## Tabela de Cenários

| Cenário | Comportamento Esperado | Severidade |
|---------|----------------------|------------|
| Criança aperta "Enviar" com canvas vazio | Feedback visual gentil ("Escreva sua resposta!") + animação apontando para o canvas. Nunca enviar ao OCR | **Crítica** |
| Criança rabisca aleatoriamente e envia | OCR retorna baixa confiança → app pede gentilmente para tentar de novo ("Hmm, não consegui entender. Tente escrever o número de novo!") | **Crítica** |
| Criança desenha o número correto mas muito pequeno | Pré-processamento (bounding box + resize) deve normalizar. OCR funciona | **Alta** |
| Criança desenha o número muito grande, saindo da área | Canvas deve ter limites visuais claros. Traço fora da área é ignorado graciosamente | **Alta** |
| Criança desenha e aperta "Limpar" várias vezes | Cada toque limpa o canvas instantaneamente. Sem delay, sem confirmação | **Média** |
| Criança desenha um número, apaga, desenha outro, e envia | Apenas o desenho final é processado pelo OCR | **Alta** |
| Criança faz traços muito finos (toque leve) | Espessura mínima do traço deve garantir visibilidade (≥4px) | **Média** |
| Criança toca o canvas com a palma da mão (palm rejection) | Idealmente ignorar toques muito grandes. Minimamente: botão "Limpar" acessível para recomeçar | **Média** |
| OCR reconhece errado (criança escreveu 5, OCR leu 6) | Deve existir opção "Não era isso" ou o app deve mostrar o que entendeu antes de validar: "Você escreveu 6?" com opção de corrigir | **Crítica** |
| Múltiplos dígitos: criança escreve "12" mas com espaço grande entre 1 e 2 | Segmentação deve tolerar espaçamento variável. Testar com espaços de 20px até 100px entre dígitos | **Alta** |

## Limiar de Confiança do OCR

O modelo retorna probabilidades para cada dígito. Defina limiares:

- **Confiança ≥ 80%**: Aceitar o reconhecimento
- **Confiança 50-79%**: Mostrar confirmação ("Você escreveu 7?")
- **Confiança < 50%**: Pedir para reescrever ("Não consegui entender, tente de novo!")

> Estes valores são iniciais e devem ser calibrados com testes reais com crianças.
