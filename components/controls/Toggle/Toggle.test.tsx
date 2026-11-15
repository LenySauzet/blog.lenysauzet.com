import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Toggle from './Toggle';

describe('Toggle', () => {
  it('is a switch named by its label, which a click on the label flips', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<Toggle label="Normals" onCheckedChange={change} />);

    await user.click(screen.getByText('Normals'));

    expect(screen.getByRole('switch', { name: 'Normals' })).toBeChecked();
    expect(change).toHaveBeenCalledWith(true);
  });
});
