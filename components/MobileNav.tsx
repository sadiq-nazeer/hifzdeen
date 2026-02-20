"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
}

interface MobileNavProps {
  items: NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-surface-muted/80 text-foreground transition hover:bg-surface-highlight/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        {isOpen ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5" aria-hidden />
        )}
      </button>

      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
          aria-hidden={!isOpen}
        />
        
        {/* Mobile menu */}
        <div
          ref={menuRef}
          className={`fixed top-0 bottom-0 left-0 z-[70] h-screen w-full max-w-[280px] border-r border-foreground/10 bg-surface-raised shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal={isOpen}
          aria-label="Navigation menu"
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-foreground/10 bg-surface-raised px-4">
              <span className="text-lg font-semibold text-foreground">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-surface-highlight/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {/* Navigation items */}
            <nav 
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-4" 
              role="navigation" 
              aria-label="Main navigation"
            >
              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block rounded-lg px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-surface-highlight/80 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </>
    </div>
  );
}
