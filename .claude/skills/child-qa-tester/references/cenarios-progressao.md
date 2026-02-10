# Cenários de Teste: Progressão e Pedagogia (Motor Kumon)

| Cenário | Comportamento Esperado | Severidade |
|---------|----------------------|------------|
| Criança acerta 5 exercícios seguidos rapidamente (<5s cada) | Sistema avança para próximo micro-nível | **Crítica** |
| Criança acerta mas lentamente (5-15s cada) | Sistema mantém no mesmo nível com variações (repetição disfarçada) | **Crítica** |
| Criança erra 3 vezes seguidas | Sistema regride um micro-nível e reforça base. Feedback encorajador especial | **Crítica** |
| Criança erra 10 vezes seguidas | Sistema regride mais, simplifica ao máximo. Considera oferecer fase concreta (objetos visuais) mesmo que a criança esteja em fase abstrata | **Crítica** |
| Criança no nível de adição recebe exercício de subtração | Nunca deve acontecer — progressão respeita sequência. Verificar que não há "vazamento" entre níveis | **Crítica** |
| Criança completa uma fase CPA (ex: concreto → pictórico) | Transição com celebração especial. Primeiros exercícios da nova fase são fáceis para criar confiança | **Alta** |
| Criança dominou um nível e volta a praticá-lo voluntariamente | Permitido e encorajado. Progresso visual não regride. Exercícios de revisão contam positivamente | **Média** |
