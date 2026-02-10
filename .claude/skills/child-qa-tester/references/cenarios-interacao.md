# Cenários de Teste: Interação e Timing

| Cenário | Comportamento Esperado | Severidade |
|---------|----------------------|------------|
| Criança fica inativa por 30+ segundos | Dica visual sutil aparece (nunca intrusiva). Se inativa por 2+ minutos, animação gentil de "Está aí?" | **Alta** |
| Criança aperta o botão "Enviar" 5 vezes seguidas rapidamente | Apenas o primeiro toque é processado. Botão fica desabilitado durante processamento do OCR (com feedback visual de loading) | **Crítica** |
| Criança toca em todo lugar da tela aleatoriamente | Nenhuma ação destrutiva é acionada. Apenas elementos interativos respondem a toque | **Crítica** |
| Criança tenta voltar durante um exercício | Progresso do exercício atual é descartado graciosamente (sem perda de progresso geral) | **Média** |
| Criança fecha o app no meio de um exercício | Ao reabrir, volta para o início do exercício atual (não perde progresso de nível) | **Alta** |
| Criança fecha o app e reabre depois de dias | Progresso total preservado. Tela inicial mostra evolução acumulada. Sessão começa com revisão rápida do último nível dominado | **Alta** |
| Transição entre exercícios | Deve haver pausa mínima (300-500ms) entre exercícios para a criança respirar. Nunca flash instantâneo para próximo exercício | **Média** |
