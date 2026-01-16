'use client';

import { useState, useEffect } from 'react';
import { useSpace } from '@/context/space-context';
import { useFirebase } from '@/firebase';
import { getSpace, SpaceData } from '@/services/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Building2, Check, Plus } from 'lucide-react';

interface SpaceSwitcherProps {
  onJoinSpace?: () => void;
  collapsed?: boolean;
}

interface SpaceInfo {
  id: string;
  name: string;
  type: string;
}

export function SpaceSwitcher({ onJoinSpace, collapsed = false }: SpaceSwitcherProps) {
  const { currentSpaceId, currentSpace, userSpaces, switchSpace, isLoading } = useSpace();
  const { firestore } = useFirebase();
  const [spacesInfo, setSpacesInfo] = useState<SpaceInfo[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  // Load info for all user spaces
  useEffect(() => {
    async function loadSpacesInfo() {
      if (!userSpaces.length) {
        setLoadingSpaces(false);
        return;
      }

      setLoadingSpaces(true);
      try {
        const spacesData = await Promise.all(
          userSpaces.map(async (spaceId) => {
            const space = await getSpace(firestore, spaceId);
            return space ? { id: spaceId, name: space.name, type: space.type } : null;
          })
        );
        setSpacesInfo(spacesData.filter((s): s is SpaceInfo => s !== null));
      } catch (err) {
        console.error('Error loading spaces info:', err);
      } finally {
        setLoadingSpaces(false);
      }
    }

    loadSpacesInfo();
  }, [userSpaces, firestore]);

  const handleSwitchSpace = async (spaceId: string) => {
    if (spaceId !== currentSpaceId) {
      await switchSpace(spaceId);
    }
  };

  // Get short name for collapsed view
  const getShortName = (name: string) => {
    const words = name.split(' ');
    if (words.length === 1) return name.substring(0, 2).toUpperCase();
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  if (isLoading || loadingSpaces) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
        {!collapsed && <div className="h-4 w-24 animate-pulse rounded bg-muted" />}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full justify-start gap-2 ${collapsed ? 'px-2' : 'px-3'}`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
            {currentSpace ? getShortName(currentSpace.name) : <Building2 className="h-4 w-4" />}
          </div>
          {!collapsed && (
            <>
              <div className="flex flex-col items-start text-left min-w-0 flex-1">
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {currentSpace?.name || 'Select Space'}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {currentSpace?.type || ''}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>Your Spaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {spacesInfo.map((space) => (
          <DropdownMenuItem
            key={space.id}
            onClick={() => handleSwitchSpace(space.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">
              {getShortName(space.name)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm truncate">{space.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{space.type}</span>
            </div>
            {space.id === currentSpaceId && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {onJoinSpace && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onJoinSpace} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Join another space
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
