import { Separator } from '../ui/separator';

interface FootnotesProps {
  notes: Array<{
    id: string;
    content: React.ReactNode;
  }>;
}

const FootnotesList = ({ notes }: FootnotesProps) => {
  if (notes.length === 0) return null;

  return (
    <section>
      <Separator />
      <ol>
        {notes.map((note) => (
          <li
            className="flex items-start gap-2"
            key={note.id}
            id={`fn-${note.id}`}
          >
            <div
              id={note.id}
              className="
      inline-flex items-center justify-center 
      text-[9px] no-underline shrink-0 
      bg-muted rounded-[0.25em] 
      font-mono font-normal [font-variant-numeric:tabular-nums]
      border border-transparent
      w-fit min-w-[12px] h-[14px] p-px
      focus-within:border-link focus-within:text-link
      hover:border-link hover:text-link
      transition-colors"
            >
              <a href={`#ref-${note.id}`}>{note.id}</a>
            </div>
            <span>{note.content}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};

export { FootnotesList };
