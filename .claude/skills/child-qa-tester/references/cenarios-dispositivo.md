# Cenários de Teste: Responsividade e Dispositivo

| Cenário | Comportamento Esperado | Severidade |
|---------|----------------------|------------|
| Tablet landscape (orientação mais provável) | Layout otimizado: exercício à esquerda, canvas à direita (ou vice-versa) | **Alta** |
| Tablet portrait | Layout reorganizado: exercício em cima, canvas embaixo | **Alta** |
| Rotação de tela no meio de exercício | Canvas preserva o desenho atual. Layout reorganiza sem perda | **Alta** |
| Tela pequena (celular) | Canvas ainda é usável (ocupa ≥60% da viewport). Elementos não se sobrepõem | **Alta** |
| Dedo gordo toca dois botões simultaneamente | Apenas um evento é processado. Elementos interativos têm espaçamento suficiente (≥12px gap) | **Média** |
| Dispositivo lento / modelo OCR carregando | Tela de loading amigável (animação, não spinner genérico). Exercícios não ficam disponíveis antes do modelo carregar | **Alta** |
