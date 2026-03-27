import { getLinkTypeIcon } from '@/lib/url-utils';
import { cn } from '@/lib/utils';
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  LinkSquare01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cva, VariantProps } from 'class-variance-authority';
import Link from 'next/link';

const anchorVariants = cva(
  'text-link inline-flex gap-1 items-baseline leading-none cursor-pointer group w-fit no-underline',
  {
    variants: {
      variant: {
        default: '',
        success: '',
      },
      discreet: {
        true: 'text-muted-foreground/75 hover:text-foreground transition-colors duration-200',
      },
      underline: {
        true: 'underline underline-offset-[3px] decoration-transparent hover:decoration-current transition-colors duration-200',
      },
      favicon: {
        true: 'px-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      discreet: false,
      underline: true,
    },
  }
);

type AnchorVariantsProps = VariantProps<typeof anchorVariants>;

interface AnchorProps extends AnchorVariantsProps {
  href: string;
  children: React.ReactNode;
  discreet?: boolean;
  underline?: boolean;
  direction?: 'left' | 'right';
  external?: boolean;
  favicon?: boolean;
}

const ArrowWrapper = ({
  direction,
  children,
}: {
  direction?: 'left' | 'right';
  children: React.ReactNode;
}) => (
  <>
    {direction === 'left' && (
      <HugeiconsIcon
        icon={ArrowLeft02Icon}
        size={22}
        strokeWidth={1.5}
        className="self-center group-hover:translate-x-[-5px] transition-transform duration-400"
      />
    )}
    {children}
    {direction === 'right' && (
      <HugeiconsIcon
        icon={ArrowRight02Icon}
        size={22}
        strokeWidth={1.5}
        className="self-center group-hover:translate-x-[5px] transition-transform duration-400"
      />
    )}
  </>
);

const Anchor = ({
  children,
  href,
  variant,
  discreet,
  underline,
  direction,
  external = true,
  favicon = true,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & AnchorProps) => {
  const linkTypeIcon = getLinkTypeIcon(href);

  if (linkTypeIcon.label === 'internal') {
    return (
      <Link
        href={href ?? '/'}
        className={cn(anchorVariants({ variant, discreet, underline, favicon }), direction && 'items-center')}
        {...props}
      >
        <ArrowWrapper direction={direction}>{children}</ArrowWrapper>
      </Link>
    );
  }

  return (
    <a
      className={cn(anchorVariants({ variant, discreet, underline, favicon }), direction && 'items-center')}
      href={href}
      {...props}
    >
      <ArrowWrapper direction={direction}>
        {favicon && linkTypeIcon.icon && (
          <HugeiconsIcon icon={linkTypeIcon.icon} size={16} strokeWidth={1.5} className="self-center" />
        )}
        {children}
        {external && linkTypeIcon.label === 'unknown' && (
          <HugeiconsIcon icon={LinkSquare01Icon} size={12} strokeWidth={2} className="self-center" />
        )}
      </ArrowWrapper>
    </a>
  );
};

export default Anchor;
