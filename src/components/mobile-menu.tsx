"use client";

import Link from "next/link";
import { useState } from "react";

import { CloseIcon, MenuIcon } from "./icons";

type NavLink = { href: string; label: string };

export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost !px-2 text-white/90 md:hidden"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-ink-950/60"
            onClick={close}
          />
          <nav className="absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-white p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-bold tracking-[0.2em] text-ink-500">
                MENU
              </span>
              <button
                type="button"
                className="btn btn-ghost !px-2"
                aria-label="Fechar menu"
                onClick={close}
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-800 hover:bg-ink-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
