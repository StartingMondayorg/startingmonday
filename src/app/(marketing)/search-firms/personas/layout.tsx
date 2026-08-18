import { ChannelSectionLayout } from '@/components/layouts/ChannelSectionLayout'

export default function SearchFirmPersonasLayout({ children }: { children: React.ReactNode }) {
  return <ChannelSectionLayout sectionHref="/search-firms" sectionLabel="Back to search-firms dashboard">{children}</ChannelSectionLayout>
}
