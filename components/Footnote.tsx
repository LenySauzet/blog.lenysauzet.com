import Anchor from './Anchor/Anchor';
import SignatureSVG from './SignatureSVG';
import { Separator } from './ui/separator';

const Footnote = () => {
  return (
    <div className="max-w-3xl mx-auto font-medium">
      <Separator />
      <p>
        Liked this article? Share it with a friend on{' '}
        <Anchor href="https://bsky.app/profile/lenysauzet.com">Bluesky</Anchor>{' '}
        or <Anchor href="https://x.com/lenysauzet">Twitter</Anchor> or{' '}
        <Anchor href="https://buymeacoffee.com/lenysauzet">support me </Anchor>{' '}
        to take on more ambitious projects to write about. Have a question,
        feedback or simply wish to contact me privately?{' '}
        <Anchor
          target="_blank"
          rel="noopener noreferrer"
          href="https://x.com/lenysauzet"
        >
          Shoot me a DM
        </Anchor>{' '}
        and I&apos;ll do my best to get back to you.
      </p>
      <br />
      <p>Have a wonderful day</p>
      <p>&mdash; Lény</p>

      <SignatureSVG className="text-muted-foreground mt-10" />
    </div>
  );
};

export default Footnote;
