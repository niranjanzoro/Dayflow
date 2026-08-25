import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OtpInput from '../OtpInput';

/** Controlled wrapper - mirrors how SignUp.jsx drives OtpInput. */
function Harness({ onComplete, initial = '' }) {
  const [value, setValue] = useState(initial);
  return (
    <OtpInput
      value={value}
      onChange={setValue}
      onComplete={onComplete}
    />
  );
}

const boxes = () => screen.getAllByLabelText(/Digit \d/);

describe('OtpInput', () => {
  it('renders six single-digit boxes', () => {
    render(<Harness />);
    expect(boxes()).toHaveLength(6);
    boxes().forEach((box) => expect(box).toHaveValue(''));
  });

  it('advances focus as digits are typed', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);

    await user.type(boxes()[0], '4');

    expect(boxes()[0]).toHaveValue('4');
    expect(boxes()[1]).toHaveFocus();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('distributes a pasted code and fires onComplete', () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);

    fireEvent.paste(boxes()[0], {
      clipboardData: { getData: () => '123456' },
    });

    boxes().forEach((box, i) => expect(box).toHaveValue(String(i + 1)));
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('ignores non-digit characters when typing', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Harness initial="12" onComplete={onComplete} />);

    await user.type(boxes()[2], 'a');
    expect(boxes()[2]).toHaveValue('');

    await user.type(boxes()[2], '9');
    expect(boxes()[2]).toHaveValue('9');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('backspace on an empty box clears the previous digit and refocuses it', async () => {
    const user = userEvent.setup();
    render(<Harness initial="123" />);

    await user.click(boxes()[3]); // first empty box
    await user.keyboard('{Backspace}');

    expect(boxes()[2]).toHaveValue('');
    expect(boxes()[0]).toHaveValue('1');
    expect(boxes()[1]).toHaveValue('2');
    expect(boxes()[2]).toHaveFocus();
  });

  it('arrow keys move between boxes without changing values', async () => {
    const user = userEvent.setup();
    render(<Harness initial="42" />);

    await user.click(boxes()[0]);
    await user.keyboard('{ArrowRight}{ArrowRight}');

    expect(boxes()[2]).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(boxes()[1]).toHaveFocus();
  });
});
