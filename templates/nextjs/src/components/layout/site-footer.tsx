import { LinkList, type LinkItem } from '@/components/widgets/link-list';

interface SiteFooterProps {
  creditText?: string;
  links?: LinkItem[];
}

const defaultLinks: LinkItem[] = [
  { label: 'Contact Us', href: '#' },
];

export function SiteFooter({
  creditText = 'Built with templateCentral',
  links = defaultLinks,
}: SiteFooterProps) {
  return (
    <footer className="w-full bg-black">
      <div className="flex-between px-6 py-6">
        <p className="text-sm text-white">{creditText}</p>

        <LinkList links={links} className="text-sm text-white" />
      </div>
    </footer>
  );
}
