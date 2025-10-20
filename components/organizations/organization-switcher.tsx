'use client';

import React from 'react';
import { useOrganization } from '@/lib/contexts/organization-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import Link from 'next/link';

export function OrganizationSwitcher() {
  const {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    isLoading,
  } = useOrganization();

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-[200px] justify-between">
        <Building2 className="mr-2 h-4 w-4" />
        <span>Loading...</span>
      </Button>
    );
  }

  if (organizations.length === 0) {
    return (
      <Link href="/organizations/new">
        <Button variant="outline" className="w-[200px] justify-between">
          <Plus className="mr-2 h-4 w-4" />
          <span>Create Organization</span>
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <div className="flex items-center">
            <Building2 className="mr-2 h-4 w-4" />
            <span className="truncate">
              {currentOrganization?.name || 'Select organization'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setCurrentOrganization(org)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{org.name}</span>
              {currentOrganization?.id === org.id && (
                <Check className="h-4 w-4 shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/organizations/new" className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Organization</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/organizations/settings" className="cursor-pointer">
            <Building2 className="mr-2 h-4 w-4" />
            <span>Manage Organizations</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
