import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Command, CommandInput } from './command';

describe('Command', () => {
  it("clears the keyboard's mark on a touch and still hands the caller its events", () => {
    const onKeyDown = vi.fn();
    const onPointerDown = vi.fn();
    render(
      <Command onKeyDown={onKeyDown} onPointerDown={onPointerDown}>
        <CommandInput placeholder="Type" />
      </Command>
    );
    const root = screen.getByRole('combobox').closest('[data-slot="command"]')!;

    fireEvent.keyDown(root, { key: 'a' });
    expect(root).toHaveAttribute('data-keyed');
    expect(onKeyDown).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(root);
    expect(root).not.toHaveAttribute('data-keyed');
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });
});
