/**
 * Sistema de Progressão - Tipos
 *
 * Define os tipos para o sistema de progressão baseado no método Kumon
 * e no modelo CPA (Concreto → Pictórico → Abstrato)
 */

/**
 * Fases do modelo CPA (Concrete-Pictorial-Abstract)
 *
 * - concrete: Uso de objetos físicos/visuais para representar quantidades
 * - pictorial: Representação visual simplificada (desenhos, diagramas)
 * - abstract: Apenas números e símbolos matemáticos
 */
export type CpaPhase = 'concrete' | 'pictorial' | 'abstract';

/**
 * Operações matemáticas suportadas
 *
 * - addition: Adição (a + b = c)
 * - subtraction: Subtração (a - b = c)
 */
export type Operation = 'addition' | 'subtraction';

/**
 * Resultado de uma tentativa de resolver um problema
 *
 * @property correct - Se a resposta estava correta
 * @property timeMs - Tempo levado para responder (em milissegundos)
 * @property attempts - Número de tentativas até acertar (ou até desistir)
 */
export type ProblemResult = {
  correct: boolean;
  timeMs: number;
  attempts: number;
};

/**
 * Nível de maestria atual da criança
 *
 * Define em que ponto do currículo a criança está, combinando:
 * - Tipo de operação (adição/subtração)
 * - Complexidade (maxResult define o maior número que pode aparecer)
 * - Fase pedagógica (CPA)
 *
 * @property operation - Tipo de operação matemática
 * @property maxResult - Maior número que pode aparecer no resultado (ex: 10 para somas até 10)
 * @property cpaPhase - Fase atual no modelo CPA
 *
 * @example
 * // Criança iniciante: somas simples até 5, fase concreta
 * { operation: 'addition', maxResult: 5, cpaPhase: 'concrete' }
 *
 * @example
 * // Criança avançada: somas até 20, fase abstrata
 * { operation: 'addition', maxResult: 20, cpaPhase: 'abstract' }
 */
export type MasteryLevel = {
  operation: Operation | 'mixed';
  maxResult: number;
  cpaPhase: CpaPhase;
};
