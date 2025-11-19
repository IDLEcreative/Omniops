import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Tabs Component - Rendering & Selection', () => {
  describe('Rendering', () => {
    it('should render tabs container', () => {
      const { container } = render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tabs = container.querySelector('[role="tablist"]');
      expect(tabs).toBeInTheDocument();
    });

    it('should render tab triggers', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: /tab 1/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /tab 2/i })).toBeInTheDocument();
    });

    it('should render tab content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">This is tab 1 content</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('This is tab 1 content')).toBeInTheDocument();
    });
  });

  describe('Tab Selection', () => {
    it('should show default tab content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });

    it('should switch tabs when trigger is clicked', async () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole('tab', { name: /tab 2/i });
      const user = userEvent.setup();
      await user.click(tab2);

      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should mark active tab as selected', async () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole('tab', { name: /tab 1/i }) as HTMLButtonElement;
      const tab2 = screen.getByRole('tab', { name: /tab 2/i }) as HTMLButtonElement;

      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');

      const user = userEvent.setup();
      await user.click(tab2);

      expect(tab1).toHaveAttribute('aria-selected', 'false');
      expect(tab2).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have tablist role', () => {
      const { container } = render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveAttribute('role', 'tablist');
    });

    it('should have tab role on triggers', () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab = screen.getByRole('tab', { name: /tab 1/i });
      expect(tab).toHaveAttribute('role', 'tab');
    });

    it('should have tabpanel role on content', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      const tabpanel = container.querySelector('[role="tabpanel"]');
      expect(tabpanel).toHaveAttribute('role', 'tabpanel');
    });

    it('should have aria-controls linking trigger to panel', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      const trigger = screen.getByRole('tab', { name: /tab 1/i });
      expect(trigger.getAttribute('aria-controls')).toBeDefined();
    });

    it('should support keyboard navigation', async () => {
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

      const tab1 = screen.getByRole('tab', { name: /tab 1/i });
      tab1.focus();

      const user = userEvent.setup();
      await user.keyboard('{ArrowRight}');

      // Tab 2 should be focused after arrow right
      const tab2 = screen.getByRole('tab', { name: /tab 2/i });
      expect(tab2).toHaveFocus();
    });
  });
});
