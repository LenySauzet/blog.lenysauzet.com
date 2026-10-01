import type { IslandState } from '../types';

export const resting: IslandState = {
  id: 'resting',
  render: () => <div className="w-20" />,
};
