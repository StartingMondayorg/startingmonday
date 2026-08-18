import { ChannelSectionLayout } from '@/app/components/ChannelSectionLayout'

export default function CoachPersonasLayout({ children }: { children: React.ReactNode }) {
  return <ChannelSectionLayout sectionHref="/coaches" sectionLabel="Back to coaches dashboard">{children}</ChannelSectionLayout>
}
