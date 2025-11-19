import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Switch } from '@/components/ui/switch';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Switch Component - Props & Use Cases', () => {
  describe('Props', () => {
    it('should accept checked prop', () => {
      const handleChange = jest.fn();
      render(<Switch checked={true} onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should accept defaultChecked prop', () => {
      render(<Switch defaultChecked={true} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should accept disabled prop', () => {
      render(<Switch disabled />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement).toBeDisabled();
    });

    it('should accept id prop', () => {
      render(<Switch id="dark-mode" />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.id).toBe('dark-mode');
    });

    it('should accept onCheckedChange callback', async () => {
      const handleChange = jest.fn();
      render(<Switch onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      const user = userEvent.setup();
      await user.click(switchElement);

      expect(handleChange).toHaveBeenCalled();
    });

    it('should accept custom className', () => {
      render(<Switch className="custom-switch" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('custom-switch');
    });

    it('should accept data attributes', () => {
      render(<Switch data-testid="theme-toggle" />);
      const switchElement = screen.getByTestId('theme-toggle');
      expect(switchElement).toBeInTheDocument();
    });
  });

  describe('Form Integration', () => {
    it('should work with form labels', () => {
      render(
        <>
          <label htmlFor="feature">
            Enable Feature
            <Switch id="feature" />
          </label>
        </>
      );
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('id', 'feature');
    });

    it('should support aria-label for accessibility in forms', () => {
      render(
        <>
          <label htmlFor="consent">
            I agree to terms
            <Switch id="consent" aria-label="Consent agreement" />
          </label>
        </>
      );
      const switchElement = screen.getByLabelText('Consent agreement');
      expect(switchElement).toBeInTheDocument();
    });
  });

  describe('Common Use Cases', () => {
    it('should work as dark mode toggle', async () => {
      const TestComponent = () => {
        const [darkMode, setDarkMode] = React.useState(false);
        return (
          <div className={darkMode ? 'dark' : 'light'}>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              aria-label="Dark mode"
            />
            <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Light Mode')).toBeInTheDocument();

      const switchElement = screen.getByRole('switch');
      const user = userEvent.setup();
      await user.click(switchElement);

      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });

    it('should work as feature toggle', async () => {
      const TestComponent = () => {
        const [featureEnabled, setFeatureEnabled] = React.useState(false);
        return (
          <>
            <Switch
              checked={featureEnabled}
              onCheckedChange={setFeatureEnabled}
              aria-label="Beta feature"
            />
            {featureEnabled && <div>Beta feature is enabled!</div>}
          </>
        );
      };

      render(<TestComponent />);
      expect(screen.queryByText('Beta feature is enabled!')).not.toBeInTheDocument();

      const switchElement = screen.getByRole('switch');
      const user = userEvent.setup();
      await user.click(switchElement);

      expect(screen.getByText('Beta feature is enabled!')).toBeInTheDocument();
    });

    it('should work as notification toggle', async () => {
      const TestComponent = () => {
        const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
        return (
          <>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              aria-label="Enable notifications"
            />
            <span>{notificationsEnabled ? 'Notifications on' : 'Notifications off'}</span>
          </>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Notifications on')).toBeInTheDocument();

      const switchElement = screen.getByRole('switch');
      const user = userEvent.setup();
      await user.click(switchElement);

      expect(screen.getByText('Notifications off')).toBeInTheDocument();
    });
  });

  describe('Multiple Switches', () => {
    it('should render multiple switches independently', () => {
      render(
        <div>
          <Switch id="switch1" />
          <Switch id="switch2" />
          <Switch id="switch3" />
        </div>
      );

      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(3);
    });

    it('should handle independent state changes', async () => {
      const TestComponent = () => {
        const [state1, setState1] = React.useState(false);
        const [state2, setState2] = React.useState(false);

        return (
          <>
            <Switch checked={state1} onCheckedChange={setState1} aria-label="Switch 1" />
            <Switch checked={state2} onCheckedChange={setState2} aria-label="Switch 2" />
            <div>
              State 1: {state1 ? 'on' : 'off'}, State 2: {state2 ? 'on' : 'off'}
            </div>
          </>
        );
      };

      render(<TestComponent />);
      const switches = screen.getAllByRole('switch');

      expect(screen.getByText('State 1: off, State 2: off')).toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(switches[0]);

      expect(screen.getByText('State 1: on, State 2: off')).toBeInTheDocument();

      await user.click(switches[1]);

      expect(screen.getByText('State 1: on, State 2: on')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggling', async () => {
      const handleChange = jest.fn();
      render(<Switch onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      const user = userEvent.setup();
      await user.click(switchElement);
      await user.click(switchElement);
      await user.click(switchElement);

      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it('should maintain focus after toggle', async () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      expect(switchElement).toHaveFocus();

      const user = userEvent.setup();
      await user.click(switchElement);

      expect(switchElement).toHaveFocus();
    });

    it('should work without explicit id', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });
  });
});
