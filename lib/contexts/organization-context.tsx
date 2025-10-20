'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { OrganizationWithRole } from '@/types/organizations';

interface OrganizationContextType {
  organizations: OrganizationWithRole[];
  currentOrganization: OrganizationWithRole | null;
  isLoading: boolean;
  error: string | null;
  setCurrentOrganization: (org: OrganizationWithRole | null) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/organizations');

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      setOrganizations(data.organizations || []);

      // Load saved organization from localStorage or use first one
      if (data.organizations && data.organizations.length > 0) {
        const savedOrgId = typeof window !== 'undefined'
          ? localStorage.getItem('currentOrganizationId')
          : null;

        const savedOrg = savedOrgId
          ? data.organizations.find((org: OrganizationWithRole) => org.id === savedOrgId)
          : null;

        setCurrentOrganization(savedOrg || data.organizations[0]);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Save current organization to localStorage when it changes
  useEffect(() => {
    if (currentOrganization && typeof window !== 'undefined') {
      localStorage.setItem('currentOrganizationId', currentOrganization.id);
    }
  }, [currentOrganization]);

  const value = {
    organizations,
    currentOrganization,
    isLoading,
    error,
    setCurrentOrganization,
    refreshOrganizations: fetchOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);

  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }

  return context;
}
