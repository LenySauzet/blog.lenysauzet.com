import type { IslandState } from '../types';

import { hint } from './hint';
import { identity } from './identity';
import { reading } from './reading';

/**
 * Ordered, and the order is the priority: the first state whose condition holds
 * wins. `identity` carries no condition and comes last, so the island always has
 * something to be.
 *
 * `hint` sits above `reading` on purpose. While the pointer rests on the island it
 * answers "what can I do here", and the moment it leaves the article takes its
 * surface back.
 *
 * Adding a state is a file here and a line below. Nothing in the island changes.
 */
export const islandStates: IslandState[] = [hint, reading, identity];
