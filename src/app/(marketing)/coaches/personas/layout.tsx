import { ChannelSectionLayout } from '@/components/layouts/ChannelSectionLayout'

export default function CoachPersonasLayout({ children }: { children: React.ReactNode }) {
  return <ChannelSectionLayout sectionHref="/coaches" sectionLabel="Back to coaches dashboard">{children}</ChannelSectionLayout>
}
