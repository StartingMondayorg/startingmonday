import { ChannelSectionLayout } from '@/components/layouts/ChannelSectionLayout'

export default function OutplacementLayout({ children }: { children: React.ReactNode }) {
  return <ChannelSectionLayout sectionHref="/for-outplacement" sectionLabel="Back to outplacement guide">{children}</ChannelSectionLayout>
}
