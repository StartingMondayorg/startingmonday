import { ChannelSectionLayout } from '@/components/layouts/ChannelSectionLayout'

export default function ExecutivesLayout({ children }: { children: React.ReactNode }) {
  return <ChannelSectionLayout sectionHref="/for-executives" sectionLabel="Back to executives guide">{children}</ChannelSectionLayout>
}
