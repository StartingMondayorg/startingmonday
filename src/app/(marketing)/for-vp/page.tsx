import { permanentRedirect } from 'next/navigation'

export default function LegacyForVpPage() {
  permanentRedirect('/for-executives/leadership')
}
