import type { IslandState } from '../types';

import { hint } from './hint';
import { identity } from './identity';
import { reading } from './reading';

export const islandStates: IslandState[] = [hint, reading, identity];
