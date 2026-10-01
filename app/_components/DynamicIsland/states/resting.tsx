import type { IslandState } from '../types';

/**
 * The island saying nothing: the shape it collapses to between two states, and the
 * shape it is before it has anything to say.
 *
 * Never resolved by a condition, so it is not in the registry. It is staged by the
 * island itself, which is why every change reads as the island closing and opening
 * again rather than as one width snapping to another.
 */
export const resting: IslandState = {
  id: 'resting',
  render: () => <div className="w-20" />,
};
