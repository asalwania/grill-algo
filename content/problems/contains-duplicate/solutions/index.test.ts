import { describeSolutionCoverage } from '../../../../lib/solution-coverage'
import { traces } from '../trace'
import { solutions } from './index'

describeSolutionCoverage(traces, solutions)
