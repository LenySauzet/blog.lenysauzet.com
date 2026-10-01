import type { Command, CommandContext } from './types';

const AT_MOST = 5;

export interface Partitioned {
  recommended: Command[];
  rest: Command[];
}

export function partitionByRecommendation(
  commands: Command[],
  context: CommandContext
): Partitioned {
  const recommended = commands
    .filter((command) => command.recommend?.(context) ?? false)
    .slice(0, AT_MOST);

  return {
    recommended,
    rest: commands.filter((command) => !recommended.includes(command)),
  };
}
