import { fireEvent, render, screen } from '@testing-library/react-native';

import { TicketQuantityStepper } from '@/components/TicketQuantityStepper';
import { FontsProvider, fallbackFonts } from '@/lib/fonts';

function renderStepper(
  props: Partial<{
    value: number;
    max: number;
    min: number;
    disabled: boolean;
    onChange: (next: number) => void;
  }> = {},
) {
  const onChange = props.onChange ?? jest.fn();
  render(
    <FontsProvider value={fallbackFonts}>
      <TicketQuantityStepper
        value={props.value ?? 1}
        min={props.min ?? 1}
        max={props.max ?? 8}
        disabled={props.disabled}
        onChange={onChange}
      />
    </FontsProvider>,
  );
  return { onChange };
}

describe('TicketQuantityStepper', () => {
  it('increments until max', () => {
    const { onChange } = renderStepper({ value: 1, max: 2 });
    fireEvent.press(screen.getByLabelText('Increase quantity'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('does not increment past max', () => {
    const { onChange } = renderStepper({ value: 2, max: 2 });
    fireEvent.press(screen.getByLabelText('Increase quantity'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('decrements down to min', () => {
    const { onChange } = renderStepper({ value: 2, max: 8 });
    fireEvent.press(screen.getByLabelText('Decrease quantity'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('does not decrement below min', () => {
    const { onChange } = renderStepper({ value: 1, max: 8 });
    fireEvent.press(screen.getByLabelText('Decrease quantity'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
