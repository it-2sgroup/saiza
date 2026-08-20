"use client";

import { useActionState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { ActionButton } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { OfficeLocations } from "@/components/shared/OfficeLocations";
import { submitContactForm, type ContactFormState } from "./actions";
import type { OfficeConfig } from "@/lib/content/site-config";

const initialState: ContactFormState = { error: null, sent: false };

type ContactPageContentProps = {
  phone: string;
  email: string;
  office1Address: string;
  office2Address: string;
  offices: OfficeConfig[];
};

export function ContactPageContent({ phone, email, office1Address, office2Address, offices }: ContactPageContentProps) {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);

  return (
    <>
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-14 pt-32 pb-24">
        <div className="flex flex-col gap-4.5">
          <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            {t.contactPage.eyebrow}
          </span>
          <h1 className="text-[clamp(32px,3.8vw,50px)] leading-[1.1] font-medium tracking-[-0.02em]">
            {t.contactPage.title}
          </h1>
          <p className="text-[16.5px] leading-[1.8] text-ink-2">{t.contactPage.subtitle}</p>
          <div className="mt-3 flex flex-col gap-5 border-t border-line pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.12em] text-ink-2 uppercase">{t.contactPage.hotlineLabel}</span>
              <span className="text-[19px] font-semibold">{phone}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.12em] text-ink-2 uppercase">{t.contactPage.emailLabel}</span>
              <span className="text-base font-medium">{email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.12em] text-ink-2 uppercase">{t.contactPage.office1Label}</span>
              <span className="text-[15px] leading-[1.6]">{office1Address}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.12em] text-ink-2 uppercase">{t.contactPage.office2Label}</span>
              <span className="text-[15px] leading-[1.6]">{office2Address}</span>
            </div>
          </div>
        </div>

        <form action={formAction} className="relative flex h-fit flex-col gap-4 rounded-card border border-line bg-card p-8">
          <h2 className="text-[22px] font-semibold">{t.contactPage.formTitle}</h2>
          <p className="text-[14.5px] leading-[1.65] text-ink-2">{t.contactPage.formSubtitle}</p>
          {/* Honeypot — invisible to real visitors, left unlabeled so screen
              readers skip it; bots that auto-fill every field tend to fill
              this in too, which silently marks the submission as spam. */}
          <input
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          <FormField id="contact-name" label={t.contactPage.placeholders.name} required />
          <FormField id="contact-phone" label={t.contactPage.placeholders.phone} type="tel" />
          <FormField id="contact-email" label={t.contactPage.placeholders.email} type="email" />
          <FormField id="contact-region" label={t.contactPage.placeholders.region} />
          <FormField id="contact-message" label={t.contactPage.placeholders.message} multiline />
          <ActionButton type="submit" variant="accent" className="text-center" disabled={pending}>
            {pending ? "..." : t.contactPage.submit}
          </ActionButton>
          {state.error && <span className="text-center text-sm font-medium text-red-600">{state.error}</span>}
          {state.sent && <span className="text-center text-sm font-semibold text-accent-2">{t.contactPage.sent}</span>}
        </form>
      </Container>

      <Container className="pb-24">
        <div className="mb-6 flex max-w-[620px] flex-col gap-3.5">
          <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            {t.home.offices.eyebrow}
          </span>
          <h2 className="text-[clamp(28px,3.2vw,42px)] leading-[1.1] font-medium tracking-[-0.02em]">
            {t.home.offices.title}
          </h2>
        </div>
        <OfficeLocations offices={offices} />
      </Container>
    </>
  );
}
