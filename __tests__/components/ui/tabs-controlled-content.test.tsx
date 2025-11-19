import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Tabs Component - Controlled & Content', () => {
  describe('Multiple Tabs', () => {
    it('should render multiple tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Home</TabsTrigger>
            <TabsTrigger value="tab2">Profile</TabsTrigger>
            <TabsTrigger value="tab3">Settings</TabsTrigger>
            <TabsTrigger value="tab4">Help</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Home content</TabsContent>
          <TabsContent value="tab2">Profile content</TabsContent>
          <TabsContent value="tab3">Settings content</TabsContent>
          <TabsContent value="tab4">Help content</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /help/i })).toBeInTheDocument();
    });

    it('should switch between all tabs', async () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const user = userEvent.setup();

      await user.click(screen.getByRole('tab', { name: /tab 2/i }));
      expect(screen.getByText('Content 2')).toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: /tab 3/i }));
      expect(screen.getByText('Content 3')).toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: /tab 1/i }));
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  describe('Controlled Tabs', () => {
    it('should work as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('tab1');
        return (
          <>
            <Tabs value={value} onValueChange={setValue}>
              <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">Content 1</TabsContent>
              <TabsContent value="tab2">Content 2</TabsContent>
            </Tabs>
            <div>Current: {value}</div>
          </>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Current: tab1')).toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(screen.getByRole('tab', { name: /tab 2/i }));

      expect(screen.getByText('Current: tab2')).toBeInTheDocument();
    });

    it('should call onValueChange callback', async () => {
      const handleChange = jest.fn();
      render(
        <Tabs defaultValue="tab1" onValueChange={handleChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole('tab', { name: /tab 2/i }));

      expect(handleChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Disabled Tabs', () => {
    it('should handle disabled tab triggers', async () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole('tab', { name: /tab 2/i }) as HTMLButtonElement;
      expect(tab2).toBeDisabled();

      const user = userEvent.setup();
      await user.click(tab2);

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });
  });

  describe('Tab Content Persistence', () => {
    it('should maintain state within tab content', async () => {
      const TestComponent = () => {
        return (
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              <Counter />
            </TabsContent>
            <TabsContent value="tab2">Tab 2 content</TabsContent>
          </Tabs>
        );
      };

      const Counter = () => {
        const [count, setCount] = React.useState(0);
        return (
          <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </div>
        );
      };

      render(<TestComponent />);
      const incrementButton = screen.getByRole('button', { name: /increment/i });

      const user = userEvent.setup();
      await user.click(incrementButton);
      expect(screen.getByText('Count: 1')).toBeInTheDocument();
    });
  });

  describe('Tab Content Types', () => {
    it('should render text content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Simple text content</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('should render form content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Form Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <form>
              <input type="text" placeholder="Name" />
              <button type="submit">Submit</button>
            </form>
          </TabsContent>
        </Tabs>
      );

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should render complex nested content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Complex</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div>
              <h2>Heading</h2>
              <p>Description</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Heading')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tabs', () => {
      render(<Tabs defaultValue="tab1" />);
      // Should render without errors
    });

    it('should handle single tab', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Only Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Single content</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: /only tab/i })).toBeInTheDocument();
      expect(screen.getByText('Single content')).toBeInTheDocument();
    });

    it('should handle many tabs', () => {
      const tabs = Array.from({ length: 10 }, (_, i) => `tab${i + 1}`);

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab} value={tab}>
              Content for {tab}
            </TabsContent>
          ))}
        </Tabs>
      );

      expect(screen.getAllByRole('tab')).toHaveLength(10);
    });
  });

  describe('Styling', () => {
    it('should accept custom className', () => {
      const { container } = render(
        <Tabs className="custom-tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(container.firstChild).toHaveClass('custom-tabs');
    });
  });
});
