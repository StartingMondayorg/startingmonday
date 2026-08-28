'use client'
import { useState } from 'react'
import Link from 'next/link'
import { deleteNotes } from './actions'
import ProfileResumeUpload from './profile-resume-upload'
import ProfileLinkedinUpload from './profile-linkedin-upload'
import CareerVerificationPanel from '@/app/components/CareerVerificationPanel'
import type { CareerEntry } from '@/app/components/CareerVerificationPanel'
import StarStoriesPanel from '@/app/(dashboard)/dashboard/_components/StarStoriesPanel'
import type { StarStory } from '@/app/(dashboard)/dashboard/_components/StarStoriesPanel'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Checkbox, Input, Label, RadioGroup, RadioGroupItem, Textarea, ToggleGroup, ToggleGroupItem } from '@/components/ui'
const BRIEFING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type Props = {
  resumeText: string
  beyondResume: string
  beyondResumePlaceholder: string
  linkedinUrl: string
  linkedinHeadline: string
  linkedinAbout: string
  targetTitles: string
  roleType: string
  currentTitle: string
  currentCompany: string
  careerEntries: CareerEntry[] | null
  starStories: StarStory[]
  securityFrameworks: string
  boardSecurityMaturity: string
  productTypeExp: string
  productAchievement: string
  productMetric: string
  cooMandateTypes: string[]
  cooCeoPartnership: string
  ctoTechnicalFlavor: string[]
  ctoArchitectureDecision: string
  dataMaturityOrientation: string
  dataPlatformBuilt: string
  digitalBackgroundType: string
  digitalTransformationDelivered: string
  briefingTime: string
  activeDays: string[]
  briefingTimezone: string | null
  briefingEmail: string
  userEmail: string
}

export function ProfileAdvancedPanels(props: Props) {
  const [briefingDays, setBriefingDays] = useState<string[]>(props.activeDays)

  return (
    <>
      <Accordion className="rounded border border-border px-4 py-3">
        <AccordionItem id="section-linkedin-upload" value="linkedin-upload">
          <AccordionTrigger className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">
            LinkedIn profile upload
          </AccordionTrigger>
          <AccordionContent>
            <Label className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              LinkedIn profile PDF
            </Label>
            <p className="text-[12px] text-muted-foreground mb-2">Upload a LinkedIn PDF to extract summary, experience, and headline.</p>
            <ProfileLinkedinUpload />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <section id="section-resume">
        <h2 className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-3">Resume and interview evidence</h2>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="resume_text" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Resume / career history</Label>
          {props.resumeText.length >= 200 && (
            <Link href="/dashboard/profile/tailor" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Tailor for a role &rarr;</Link>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground mb-2">Upload your resume or paste the text below.</p>
        <ProfileResumeUpload />
        <Textarea id="resume_text" name="resume_text" rows={12} maxLength={100000} defaultValue={props.resumeText} placeholder="Paste your resume text here, or upload a PDF/DOCX above…" className="w-full text-[14px] resize-y leading-relaxed font-mono text-[12px]" />
        <p className="mt-1.5 text-[12px] text-muted-foreground">Used in interview prep briefs and AI context.</p>
        <CareerVerificationPanel initialEntries={props.careerEntries} resumeText={props.resumeText} />
      </section>

      <div>
        <Label htmlFor="beyond_resume" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Beyond the resume</Label>
        <Textarea id="beyond_resume" name="beyond_resume" rows={4} defaultValue={props.beyondResume} placeholder={props.beyondResumePlaceholder} className="w-full text-[14px] resize-none leading-relaxed" />
        <p className="mt-1.5 text-[12px] text-muted-foreground">Extra context for briefs and outreach.</p>
      </div>

      <Accordion className="rounded border border-border px-4 py-3">
        <AccordionItem value="interview-stories">
          <AccordionTrigger className="text-[11px] font-bold tracking-[0.08em] uppercase text-primary">Interview stories</AccordionTrigger>
          <AccordionContent>
            <p className="text-[12px] text-muted-foreground mb-3">Save STAR stories for the prep brief.</p>
            <StarStoriesPanel initial={props.starStories} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion className="rounded border border-border px-4 py-3">
        <AccordionItem value="role-context">
          <AccordionTrigger className="text-[11px] font-bold tracking-[0.08em] uppercase text-primary">Role context</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-6">
            <p className="text-[12px] text-muted-foreground">Add details that do not fit in your resume.</p>
            {props.roleType === 'ciso' && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Security frameworks implemented</Label>
                  <input type="hidden" name="security_frameworks" defaultValue={props.securityFrameworks} />
                  <p className="mt-1.5 text-[12px] text-muted-foreground">Used to match your background to this company's compliance requirements in prep briefs.</p>
                </div>
                <div>
                  <Label htmlFor="board_security_maturity" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Board security maturity</Label>
                  <Textarea id="board_security_maturity" name="board_security_maturity" rows={3} defaultValue={props.boardSecurityMaturity} placeholder="What was the board's security awareness when you started? What changed by the time you left?" className="w-full text-[14px] resize-none leading-relaxed" />
                </div>
              </div>
            )}
            {props.roleType === 'cpo' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Product experience type</p>
                  <RadioGroup name="product_type_exp" defaultValue={props.productTypeExp} className="flex flex-row gap-4 w-auto">
                    {(['B2C', 'B2B', 'Both'] as const).map(opt => <label key={opt} className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value={opt} /><span className="text-[13px] text-muted-foreground">{opt}</span></label>)}
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="product_achievement" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Key product achievement</Label>
                  <Textarea id="product_achievement" name="product_achievement" rows={3} defaultValue={props.productAchievement} placeholder="What product are you most proud of and why? What user problem did it solve?" className="w-full text-[14px] resize-none leading-relaxed" />
                </div>
                <div>
                  <Label htmlFor="product_metric" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Primary metric moved</Label>
                  <Input id="product_metric" name="product_metric" type="text" defaultValue={props.productMetric} placeholder="+22% retention, 40% MAU growth..." className="w-full text-[14px]" />
                </div>
              </div>
            )}
            {props.roleType === 'coo' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Mandate type(s) sought</p>
                  <div className="flex flex-col gap-2">
                    {(['Scaling', 'Turnaround', 'Post-M&A integration', 'Professionalization'] as const).map(opt => <label key={opt} className="flex items-center gap-2 cursor-pointer"><Checkbox name="coo_mandate_types" value={opt} defaultChecked={props.cooMandateTypes.includes(opt)} /><span className="text-[13px] text-muted-foreground">{opt}</span></label>)}
                  </div>
                </div>
                <div>
                  <Label htmlFor="coo_ceo_partnership" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">CEO partnership model</Label>
                  <Textarea id="coo_ceo_partnership" name="coo_ceo_partnership" rows={3} defaultValue={props.cooCeoPartnership} placeholder="What is your model for the CEO-COO relationship?" className="w-full text-[14px] resize-none leading-relaxed" />
                </div>
              </div>
            )}
            {props.roleType === 'cto' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Technical flavor</p>
                  <div className="flex flex-col gap-2">
                    {(['Infrastructure', 'Product engineering', 'Platform', 'AI and ML'] as const).map(opt => <label key={opt} className="flex items-center gap-2 cursor-pointer"><Checkbox name="cto_technical_flavor" value={opt} defaultChecked={props.ctoTechnicalFlavor.includes(opt)} /><span className="text-[13px] text-muted-foreground">{opt}</span></label>)}
                  </div>
                </div>
                <div>
                  <Label htmlFor="cto_architecture_decision" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Key architectural decision</Label>
                  <Textarea id="cto_architecture_decision" name="cto_architecture_decision" rows={3} defaultValue={props.ctoArchitectureDecision} placeholder="What is the architectural decision you are most proud of?" className="w-full text-[14px] resize-none leading-relaxed" />
                </div>
              </div>
            )}
            {props.roleType === 'cdo_data' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Data mandate orientation</p>
                  <RadioGroup name="data_maturity_orientation" defaultValue={props.dataMaturityOrientation} className="flex flex-row gap-4 w-auto">
                    {(['Governance-first', 'Products-first'] as const).map(opt => <label key={opt} className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value={opt} /><span className="text-[13px] text-muted-foreground">{opt}</span></label>)}
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="data_platform_built" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Data platform built</Label>
                  <Textarea id="data_platform_built" name="data_platform_built" rows={3} defaultValue={props.dataPlatformBuilt} placeholder="What platform did you build or inherit and transform?" className="w-full text-[14px] resize-none leading-relaxed" />
                </div>
              </div>
            )}
            {props.roleType === 'cdo_digital' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Professional background</p>
                  <div className="flex flex-col gap-2">
                    <RadioGroup name="digital_background_type" defaultValue={props.digitalBackgroundType} className="flex flex-col gap-2 w-auto">
                      {(['Consulting', 'Operations', 'Marketing', 'Technology'] as const).map(opt => <label key={opt} className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value={opt} /><span className="text-[13px] text-muted-foreground">{opt}</span></label>)}
                    </RadioGroup>
                  </div>
                </div>
                <div>
                  <Label htmlFor="digital_transformation_delivered" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Business transformation delivered</Label>
                  <Textarea id="digital_transformation_delivered" name="digital_transformation_delivered" rows={3} defaultValue={props.digitalTransformationDelivered} placeholder="What business transformation did you drive?" className="w-full text-[14px] resize-none leading-relaxed" />
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion className="bg-card border border-border rounded p-6 max-w-xl mt-6">
        <AccordionItem id="section-data-privacy" value="data-privacy">
          <AccordionTrigger className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Data and privacy</AccordionTrigger>
          <AccordionContent>
            <section id="section-briefing" className="mb-5">
              <h2 className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-3">Briefing setup</h2>
              <Label htmlFor="briefing_time" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Daily briefing time</Label>
              <Input id="briefing_time" name="briefing_time" type="time" defaultValue={props.briefingTime} className="w-auto" />
              {props.briefingTimezone && <p className="mt-1.5 text-[12px] text-muted-foreground">{props.briefingTimezone}</p>}
              <div className="mt-4">
                <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-3">Briefing days</p>
                <ToggleGroup
                  value={briefingDays}
                  onValueChange={setBriefingDays}
                  spacing={2}
                  className="flex-wrap"
                >
                  {BRIEFING_DAYS.map(day => (
                    <ToggleGroupItem key={day} value={day} variant="outline" className="w-12 h-9 text-[12px] font-semibold">
                      {day.slice(0, 3)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {briefingDays.map(day => (
                  <input key={day} type="hidden" name="briefing_days" value={day} />
                ))}
              </div>
              <div id="briefing-email" className="mt-4">
                <Label htmlFor="briefing_email" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Briefing delivery email</Label>
                <Input id="briefing_email" name="briefing_email" type="email" defaultValue={props.briefingEmail} placeholder={props.userEmail} className="w-full max-w-sm" />
                <p className="mt-1.5 text-[12px] text-muted-foreground">Optional. If set, all briefings and system emails are sent here instead of your login address.</p>
              </div>
            </section>

            <div className="mb-5">
              <p className="text-[12px] font-semibold text-muted-foreground mb-1">Download your data</p>
              <Button variant="outline" render={<a href="/api/profile/export" />}>Download your data</Button>
            </div>
            <div className="border-t border-border pt-5">
              <p className="text-[12px] font-semibold text-muted-foreground mb-1">Delete sensitive data</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">Removes profile notes only. Your account and pipeline data remain unchanged.</p>
              <form action={deleteNotes}><Button type="submit" variant="destructive">Delete sensitive data</Button></form>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  )
}
