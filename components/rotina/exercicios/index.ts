// components/rotina/exercicios/index.ts

// Componentes principais
export { EmptyState } from './EmptyState';
export { ExercicioModal } from './ExercicioModal';
export { RequisitoCard } from './RequisitoCard';
export { SerieCombinada } from './SerieCombinada';
export { SerieSimples } from './SerieSimples';

// Hooks especializados
export { useExerciciosModal } from '../../../hooks/exercicios/useExerciciosModal';
export { useExerciciosStorage } from '../../../hooks/exercicios/useExerciciosStorage';
export { useSeriesManager } from '../../../hooks/exercicios/useSeriesManager';

// Context
export {
    ExerciciosProvider,
    useExerciciosContext,
    withExerciciosContext
} from '../../../context/ExerciciosContext';

// Tipos
export type {
    ExercicioBanco,
    ExercicioRotinaLocal,
    ExerciciosPorTreino,
    FiltrosExercicio,
    RotinaConfig,
    SerieConfig,
    TreinoConfig,
    ValidacaoExercicios
} from '../../../types/exercicio.types';

