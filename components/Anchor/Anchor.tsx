import { LinkSquare01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';

const anchorClasses = `
  text-link gap-2 items-center inline-flex 
  relative after:content-[''] after:block after:absolute after:left-0 after:right-0
  after:bottom-0 after:h-[1px] after:bg-current
  after:opacity-0 after:transition-opacity after:pointer-events-none
  hover:after:opacity-90
`;

const Anchor = ({
  children,
  href,
  isInternal = false,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  isInternal?: boolean;
}) => {
  if (isInternal) {
    return (
      <Link href={href!} className={anchorClasses} {...props}>
        {children}
        <HugeiconsIcon icon={LinkSquare01Icon} size={16} />
      </Link>
    );
  }

  return (
    <a className={anchorClasses} href={href} {...props}>
      {children}
      <HugeiconsIcon icon={LinkSquare01Icon} className="size-4" />
    </a>
  );
};

export default Anchor;
