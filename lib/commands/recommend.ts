import { GROUPS, type Command, type CommandContext } from './types';

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
    .sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group))
    .slice(0, AT_MOST);

  return {
    recommended,
    rest: commands.filter((command) => !recommended.includes(command)),
  };
}
