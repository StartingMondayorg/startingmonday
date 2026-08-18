import { ChannelSectionLayout } from '@/app/components/ChannelSectionLayout'

export default function OutplacementLayout({ children }: { children: React.ReactNode }) {
  return <ChannelSectionLayout sectionHref="/for-outplacement" sectionLabel="Back to outplacement guide">{children}</ChannelSectionLayout>
}
