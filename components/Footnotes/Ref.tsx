interface FootnoteRefProps {
  id: string;
}

const FootnoteRef = ({ id }: FootnoteRefProps) => (
  <sup
    className="
      inline-flex items-center justify-center 
      text-[9px] no-underline shrink-0 
      bg-muted rounded-[0.25em] 
      font-mono font-normal [font-variant-numeric:tabular-nums]
      border border-transparent
      w-fit min-w-[12px] h-[14px] p-px
      focus-within:border-link focus-within:text-link
      hover:border-link hover:text-link
      transition-colors
    "
  >
    <a
      id={`ref-${id}`}
      href={`#fn-${id}`}
      className="
        no-underline 
        text-inherit outline-none w-full h-full 
        flex items-center justify-center
      "
    >
      {id}
    </a>
  </sup>
);

export { FootnoteRef };
