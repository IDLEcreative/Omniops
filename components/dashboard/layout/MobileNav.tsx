"use client";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
      onClick={onClose}
    />
  );
}
