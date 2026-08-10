import type { SVGProps } from "react";

/** Ícones em traço, desenhados inline para não depender de bibliotecas. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const CartIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2 3h2.2l2.2 12.1a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H5.2" />
  </Icon>
);

export const UserIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Icon>
);

export const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Icon>
);

export const MenuIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
  </Icon>
);

export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);

export const TruckIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M2.5 6.5h11v10h-11z" />
    <path d="M13.5 10h4l3 3v3.5h-7z" />
    <circle cx="6.5" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </Icon>
);

export const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 3.5v11" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M4 19.5h16" />
  </Icon>
);

export const ShieldIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Icon>
);

export const PixIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M8.4 4.6 4.6 8.4a2.6 2.6 0 0 0 0 3.7l3.8 3.8" />
    <path d="m15.6 19.4 3.8-3.8a2.6 2.6 0 0 0 0-3.7l-3.8-3.8" />
    <path d="M8.4 19.4 12 23l3.6-3.6" />
    <path d="M8.4 4.6 12 1l3.6 3.6" />
  </Icon>
);

export const CardIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 10h19" />
    <path d="M6 15h3.5" />
  </Icon>
);

export const StoreIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 9.5V20h16V9.5" />
    <path d="M3 9.5 5 4h14l2 5.5a3 3 0 0 1-5.5 1.7A3 3 0 0 1 12 12a3 3 0 0 1-3.5-.8A3 3 0 0 1 3 9.5Z" />
    <path d="M10 20v-5h4v5" />
  </Icon>
);

export const BoxIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="m4 7.5 8 4.5 8-4.5" />
    <path d="M12 12v9" />
  </Icon>
);

export const ChartIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Icon>
);

export const UsersIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19a6 6 0 0 1 12 0" />
    <path d="M16 5.5a3.2 3.2 0 0 1 0 5.6M17.5 19a6 6 0 0 0-2.2-4.6" />
  </Icon>
);

export const TagIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M3.5 11.5V4h7.5l9 9-7.5 7.5z" />
    <circle cx="7.5" cy="8" r="1.2" />
  </Icon>
);

export const ListIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </Icon>
);

export const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
  </Icon>
);

export const MailIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </Icon>
);

export const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const AlertIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 4 2.8 20h18.4z" />
    <path d="M12 10v4.5M12 17.5h.01" />
  </Icon>
);

export const ArrowRightIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4.5 12h15M14 6.5 19.5 12 14 17.5" />
  </Icon>
);

export const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5 7.5 20h9l1-13.5" />
  </Icon>
);

export const PencilIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 20h4L20 8l-4-4L4 16z" />
  </Icon>
);

export const BookIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 4.5h9.5A3.5 3.5 0 0 1 17 8v11.5H7.5A3.5 3.5 0 0 1 4 16z" />
    <path d="M17 8h3v11.5h-3" />
  </Icon>
);
