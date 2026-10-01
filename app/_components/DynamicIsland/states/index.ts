import type { IslandState } from '../types';

import { finished } from './finished';
import { hint } from './hint';
import { identity } from './identity';
import { reading } from './reading';

export const islandStates: IslandState[] = [hint, finished, reading, identity];
